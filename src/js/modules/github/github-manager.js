export class GitHubManager {
    constructor(options = {}) {
        this.accessToken = localStorage.getItem('github_access_token');
        this.username = localStorage.getItem('github_username');
        this.repoName = options.repoName || 'escriba-notes';
        this.isAuthenticated = !!this.accessToken;
        this.syncInProgress = false;
        this.lastSyncTime = localStorage.getItem('last_sync_time') || null;
        this.onStatusChange = options.onStatusChange || (() => { });
        this.showToast = options.showToast || (() => { });
        this.baseUrl = 'https://api.github.com';
    }

    async fetchWithTimeout(url, options = {}, timeout = 15000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Escriba-App-Sync',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal
            });

            clearTimeout(id);

            if (response.status === 401) {
                this.logout();
                throw new Error('Sesión de GitHub expirada (401).');
            }

            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('La solicitud a GitHub tardó demasiado tiempo. Probá de nuevo.');
            }
            throw error;
        }
    }

    async connectWithToken(token) {
        if (!token || (!token.startsWith('ghp_') && !token.startsWith('github_pat_'))) {
            throw new Error('Token inválido. Debe comenzar con "ghp_" o "github_pat_"');
        }

        const originalToken = this.accessToken;
        try {
            this.accessToken = token;
            const userInfo = await this.getUserInfo();

            this.username = userInfo.login;
            this.isAuthenticated = true;

            localStorage.setItem('github_access_token', this.accessToken);
            localStorage.setItem('github_username', this.username);

            this.onStatusChange('connected');
            return userInfo;
        } catch (error) {
            this.accessToken = originalToken;
            if (!this.accessToken) this.logout();
            throw error;
        }
    }

    logout() {
        this.accessToken = null;
        this.username = null;
        this.isAuthenticated = false;
        localStorage.removeItem('github_access_token');
        localStorage.removeItem('github_username');
        localStorage.removeItem('last_sync_time');
        this.onStatusChange('disconnected');
    }

    async getUserInfo() {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/user`);
        if (!response.ok) throw new Error(`Error en la API de GitHub: ${response.status}`);
        return await response.json();
    }

    async sync(localData) {
        if (!this.isAuthenticated || this.syncInProgress) return null;

        this.syncInProgress = true;
        this.onStatusChange('syncing');

        try {
            const remoteData = await this.getRemoteData();
            const mergedData = this.mergeData(localData, remoteData);

            await this.uploadData(mergedData);

            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('last_sync_time', this.lastSyncTime);

            this.onStatusChange('connected');
            return mergedData;
        } catch (error) {
            console.error('Sync failed:', error);
            this.onStatusChange('error', error.message);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    async getRemoteData() {
        const data = { subjects: [], events: [], settings: {} };

        const files = [
            { path: 'data/subjects.json', key: 'subjects', default: [] },
            { path: 'data/events.json', key: 'events', default: [] },
            { path: 'data/settings.json', key: 'settings', default: {} }
        ];

        for (const file of files) {
            try {
                const result = await this.getFile(file.path);
                if (result && result.content) {
                    data[file.key] = JSON.parse(result.content);
                }
            } catch (e) {
                data[file.key] = file.default;
            }
        }

        return data;
    }

    mergeData(local, remote) {
        const merged = {
            subjects: [...remote.subjects],
            events: [...remote.events],
            settings: { ...remote.settings, ...local.settings }
        };

        local.subjects.forEach(localSub => {
            const idx = merged.subjects.findIndex(s => s.id === localSub.id);
            if (idx >= 0) {
                const remoteSub = merged.subjects[idx];

                const mergedNotes = [...remoteSub.notes];
                localSub.notes.forEach(localNote => {
                    const noteIdx = mergedNotes.findIndex(n => n.id === localNote.id);
                    if (noteIdx >= 0) {
                        const localUpdate = new Date(localNote.updatedAt || localNote.createdAt || 0);
                        const remoteUpdate = new Date(mergedNotes[noteIdx].updatedAt || mergedNotes[noteIdx].createdAt || 0);

                        if (localUpdate > remoteUpdate) {
                            mergedNotes[noteIdx] = localNote;
                        }
                    } else {
                        mergedNotes.push(localNote);
                    }
                });

                const localSubUpdate = new Date(localSub.lastModified || 0);
                const remoteSubUpdate = new Date(remoteSub.lastModified || 0);

                if (localSubUpdate > remoteSubUpdate) {
                    merged.subjects[idx] = {
                        ...localSub,
                        notes: mergedNotes
                    };
                } else {
                    merged.subjects[idx] = {
                        ...remoteSub,
                        notes: mergedNotes
                    };
                }
            } else {
                merged.subjects.push(localSub);
            }
        });

        local.events.forEach(localEvent => {
            const idx = merged.events.findIndex(e => e.id === localEvent.id);
            if (idx === -1) {
                merged.events.push(localEvent);
            }
        });

        return merged;
    }

    async getFile(path) {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/repos/${this.username}/${this.repoName}/contents/${path}`);

        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`Error getting ${path}: ${response.status}`);

        const data = await response.json();
        return {
            content: this.decodeContent(data.content),
            sha: data.sha
        };
    }

    async uploadData(data) {
        await this.ensureRepository();

        const files = [
            { path: 'data/subjects.json', content: JSON.stringify(data.subjects, null, 2) },
            { path: 'data/events.json', content: JSON.stringify(data.events, null, 2) },
            { path: 'data/settings.json', content: JSON.stringify(data.settings, null, 2) }
        ];

        const noteIds = [];
        for (const subject of data.subjects) {
            for (const note of subject.notes) {
                noteIds.push(note.id);
                const noteData = {
                    ...note,
                    subjectId: subject.id
                };
                files.push({
                    path: `data/notes/${note.id}.json`,
                    content: JSON.stringify(noteData, null, 2)
                });
            }
        }

        files.push({
            path: 'data/notes-index.json',
            content: JSON.stringify(noteIds, null, 2)
        });

        const maxBatchRetries = 3;
        for (let batchAttempt = 1; batchAttempt <= maxBatchRetries; batchAttempt++) {
            try {
                console.log(`Iniciando sincronización por lotes de ${files.length} archivos (Intento ${batchAttempt}/${maxBatchRetries})...`);
                const branch = 'main';
                const headSha = await this.getBranchHead(branch);
                const baseTreeSha = await this.getTreeSha(headSha);
                const newTreeSha = await this.createTree(files, baseTreeSha);
                const commitSha = await this.createCommit(`Sync data - ${new Date().toISOString()}`, newTreeSha, headSha);
                await this.updateRef(branch, commitSha);
                console.log('Sincronización por lotes completada con éxito.');
                return;
            } catch (error) {
                console.warn(`Intento ${batchAttempt} de sincronización por lotes falló:`, error.message);
                if (batchAttempt === maxBatchRetries) {
                    console.error('Sincronización por lotes falló definitivamente, intentando fallback secuencial (lento)...');
                    for (const file of files) {
                        await this.updateFile(file.path, file.content);
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000 * batchAttempt));
                }
            }
        }
    }

    async ensureRepository() {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/repos/${this.username}/${this.repoName}`);

        if (response.status === 404) {
            await this.createRepository();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    async createRepository() {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/user/repos`, {
            method: 'POST',
            body: JSON.stringify({
                name: this.repoName,
                private: true,
                auto_init: true
            })
        });
        if (!response.ok) throw new Error(`Error al crear repositorio: ${response.status}`);
    }

    async updateFile(path, content, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const existing = await this.getFile(path);
                const body = {
                    message: `Sync ${path} - ${new Date().toISOString()}`,
                    content: this.encodeContent(content)
                };
                if (existing) body.sha = existing.sha;

                const response = await this.fetchWithTimeout(`${this.baseUrl}/repos/${this.username}/${this.repoName}/contents/${path}`, {
                    method: 'PUT',
                    body: JSON.stringify(body)
                });

                if (response.status === 409) {
                    if (attempt < retries) {
                        console.log(`Conflicto (409) para ${path}, reintentando en 1s (Intento ${attempt}/${retries})...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(`Error actualizando ${path}: ${response.status} - ${errorData.message}`);
                }

                return await response.json();
            } catch (error) {
                if (attempt === retries) throw error;
                console.warn(`Intento ${attempt} fallido para ${path}:`, error.message);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async getBranchHead(branch) {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/repos/${this.username}/${this.repoName}/git/refs/heads/${branch}`);
        if (!response.ok) throw new Error(`Error al obtener head de la rama: ${response.status}`);
        const data = await response.json();
        return data.object.sha;
    }

    async getTreeSha(commitSha) {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/repos/${this.username}/${this.repoName}/git/commits/${commitSha}`);
        if (!response.ok) throw new Error(`Error al obtener tree sha: ${response.status}`);
        const data = await response.json();
        return data.tree.sha;
    }

    async createTree(files, baseTreeSha) {
        const tree = files.map(file => ({
            path: file.path,
            mode: '100644',
            type: 'blob',
            content: file.content
        }));

        const response = await this.fetchWithTimeout(`${this.baseUrl}/repos/${this.username}/${this.repoName}/git/trees`, {
            method: 'POST',
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: tree
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Error al crear árbol: ${response.status} - ${err.message}`);
        }
        const data = await response.json();
        return data.sha;
    }

    async createCommit(message, treeSha, parentSha) {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/repos/${this.username}/${this.repoName}/git/commits`, {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                tree: treeSha,
                parents: [parentSha]
            })
        });

        if (!response.ok) throw new Error(`Error al crear commit: ${response.status}`);
        const data = await response.json();
        return data.sha;
    }

    async updateRef(branch, commitSha) {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/repos/${this.username}/${this.repoName}/git/refs/heads/${branch}`, {
            method: 'PATCH',
            body: JSON.stringify({
                sha: commitSha,
                force: true
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Error al actualizar referencia: ${response.status} - ${err.message}`);
        }
        return await response.json();
    }

    encodeContent(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    decodeContent(str) {
        return decodeURIComponent(escape(atob(str)));
    }
}
