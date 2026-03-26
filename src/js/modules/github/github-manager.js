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
    }

    async connectWithToken(token) {
        if (!token || !token.startsWith('ghp_')) {
            throw new Error('Token inválido. Debe comenzar con "ghp_"');
        }

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
            this.logout();
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
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
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
        const response = await fetch(`https://api.github.com/repos/${this.username}/${this.repoName}/contents/${path}`, {
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

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

        const filesToUpload = [
            { path: 'data/subjects.json', content: JSON.stringify(data.subjects, null, 2) },
            { path: 'data/events.json', content: JSON.stringify(data.events, null, 2) },
            { path: 'data/settings.json', content: JSON.stringify(data.settings, null, 2) }
        ];

        for (const file of filesToUpload) {
            await this.updateFile(file.path, file.content);
        }
    }

    async ensureRepository() {
        const response = await fetch(`https://api.github.com/repos/${this.username}/${this.repoName}`, {
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            await this.createRepository();
        }
    }

    async createRepository() {
        await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.repoName,
                private: true,
                auto_init: true
            })
        });
    }

    async updateFile(path, content, retry = true) {
        const existing = await this.getFile(path);
        const body = {
            message: `Sync ${path} - ${new Date().toISOString()}`,
            content: this.encodeContent(content)
        };
        if (existing) body.sha = existing.sha;

        const response = await fetch(`https://api.github.com/repos/${this.username}/${this.repoName}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });

        if (response.status === 409 && retry) {
            console.log(`Conflict (409) detected for ${path}, retrying...`);
            return this.updateFile(path, content, false);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Error updating ${path}: ${response.status} - ${errorData.message}`);
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
