class GitHubSync {
    constructor() {
        this.redirectUri = window.location.origin + window.location.pathname;
        this.accessToken = localStorage.getItem('github_access_token');
        this.username = localStorage.getItem('github_username');
        this.repoName = 'escriba-notes';
        this.isAuthenticated = !!this.accessToken;
        this.syncInProgress = false;
        this.lastSyncTime = localStorage.getItem('last_sync_time') || null;
    }

    async authenticate() {
        await this.authenticateWithPersonalToken();
    }

    async authenticateWithPersonalToken() {
        this.showPersonalTokenModal();
    }

    showPersonalTokenModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fab fa-github"></i> Conectar con GitHub</h3>
                </div>
                <div class="modal-body">
                    <div class="token-auth-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <p>Creá un Personal Access Token en GitHub:</p>
                                <button class="btn btn-primary" onclick="window.open('https://github.com/settings/tokens/new?scopes=repo&description=Escriba%20Notes%20Sync', '_blank')">
                                    <i class="fab fa-github"></i> Crear Token en GitHub
                                </button>
                                <small class="help-text">Se abrirá GitHub con los permisos correctos preseleccionados</small>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <p>Copiá el token y pegalo acá:</p>
                                <div class="token-input-group">
                                    <input type="password" id="githubToken" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" class="token-input">
                                    <button class="btn btn-secondary btn-sm" id="toggleTokenVisibility">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <small class="help-text">El token se guarda localmente en tu navegador</small>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <button class="btn btn-success" id="connectWithToken" disabled>
                                    <i class="fas fa-link"></i> Conectar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.tokenModal = modal;
        
        const tokenInput = modal.querySelector('#githubToken');
        const connectBtn = modal.querySelector('#connectWithToken');
        const toggleBtn = modal.querySelector('#toggleTokenVisibility');
        
        tokenInput.addEventListener('input', () => {
            connectBtn.disabled = !tokenInput.value.trim();
        });
        
        toggleBtn.addEventListener('click', () => {
            const isPassword = tokenInput.type === 'password';
            tokenInput.type = isPassword ? 'text' : 'password';
            toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
        
        connectBtn.addEventListener('click', () => {
            this.connectWithToken(tokenInput.value.trim());
        });
        
        tokenInput.focus();
    }

    async connectWithToken(token) {
        if (!token || !token.startsWith('ghp_')) {
            this.showError('Token inválido. Debe empezar con "ghp_"');
            return;
        }

        try {
            this.accessToken = token;
            const userInfo = await this.getUserInfo();
            
            localStorage.setItem('github_access_token', this.accessToken);
            this.username = userInfo.login;
            localStorage.setItem('github_username', this.username);
            
            this.isAuthenticated = true;
            
            if (this.tokenModal) {
                this.tokenModal.remove();
            }
            
            this.showSuccess('¡Conectado a GitHub exitosamente!');
            this.updateSyncUI();
            
            if (window.cuadernoDigital) {
                await window.cuadernoDigital.performInitialSync();
            }
            
        } catch (error) {
            console.error('Token authentication failed:', error);
            this.accessToken = null;
            
            if (error.message.includes('401')) {
                this.showError('Token inválido o expirado');
            } else if (error.message.includes('403')) {
                this.showError('Token sin permisos suficientes. Asegurate de seleccionar "repo"');
            } else {
                this.showError('Error al conectar con GitHub');
            }
        }
    }



    logout() {
        this.accessToken = null;
        this.username = null;
        this.isAuthenticated = false;
        localStorage.removeItem('github_access_token');
        localStorage.removeItem('github_username');
        localStorage.removeItem('last_sync_time');
        this.updateSyncUI();
    }

    async ensureRepository() {
        if (!this.isAuthenticated) return false;

        try {
            const response = await fetch(`https://api.github.com/repos/${this.username}/${this.repoName}`, {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                await this.createRepository();
            } else if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error ensuring repository:', error);
            this.showError('Error al acceder al repositorio de GitHub');
            return false;
        }
    }

    async createRepository() {
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.repoName,
                description: 'Escriba - Mis apuntes sincronizados',
                private: true,
                auto_init: true
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to create repository: ${response.status}`);
        }

        await this.createInitialFiles();
    }

    async createInitialFiles() {
        const readmeContent = `# Escriba

Este repositorio contiene mis apuntes sincronizados desde Escriba.

## Estructura

- \`data/subjects.json\` - Materias y configuración
- \`data/notes/\` - Archivos de apuntes individuales
- \`data/events.json\` - Eventos del calendario
- \`data/settings.json\` - Configuración personal

## Sincronización

Los datos se sincronizan automáticamente cuando usas Escriba en cualquier dispositivo.
`;

        await this.createOrUpdateFile('README.md', readmeContent, 'Configuración inicial de Escriba');

        await this.createOrUpdateFile('data/.gitkeep', '', 'Crear estructura de directorios');
    }

    async syncData(cuadernoData, events, settings) {
        if (!this.isAuthenticated || this.syncInProgress) {
            return false;
        }

        this.syncInProgress = true;
        this.updateSyncUI();

        try {
            await this.ensureRepository();

            const remoteData = await this.getRemoteData();

            const mergedData = await this.mergeData(
                { subjects: cuadernoData, events, settings },
                remoteData
            );

            await this.uploadData(mergedData);

            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('last_sync_time', this.lastSyncTime);

            this.showSuccess('Datos sincronizados correctamente');
            return mergedData;

        } catch (error) {
            console.error('Sync failed:', error);
            this.showError('Error al sincronizar con GitHub');
            return false;
        } finally {
            this.syncInProgress = false;
            this.updateSyncUI();
        }
    }

    async getRemoteData() {
        const data = {
            subjects: [],
            events: [],
            settings: {}
        };

        try {
            const subjectsResponse = await this.getFile('data/subjects.json');
            if (subjectsResponse) {
                data.subjects = JSON.parse(subjectsResponse.content);
            }

            const eventsResponse = await this.getFile('data/events.json');
            if (eventsResponse) {
                data.events = JSON.parse(eventsResponse.content);
            }

            const settingsResponse = await this.getFile('data/settings.json');
            if (settingsResponse) {
                data.settings = JSON.parse(settingsResponse.content);
            }

            const notesListResponse = await this.getFile('data/notes-index.json');
            if (notesListResponse) {
                const notesList = JSON.parse(notesListResponse.content);

                for (const noteId of notesList) {
                    try {
                        const noteResponse = await this.getFile(`data/notes/${noteId}.json`);
                        if (noteResponse) {
                            const noteData = JSON.parse(noteResponse.content);

                            const subject = data.subjects.find(s => s.id === noteData.subjectId);
                            if (subject) {
                                const existingNote = subject.notes.find(n => n.id === noteData.id);
                                if (!existingNote) {
                                    subject.notes.push(noteData);
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to load note ${noteId}:`, error);
                    }
                }
            }

        } catch (error) {
            console.warn('No remote data found or error loading:', error);
        }

        return data;
    }

    async mergeData(localData, remoteData) {
        const merged = {
            subjects: [...remoteData.subjects],
            events: [...remoteData.events],
            settings: { ...remoteData.settings, ...localData.settings }
        };

        for (const localSubject of localData.subjects) {
            const remoteSubject = merged.subjects.find(s => s.id === localSubject.id);

            if (!remoteSubject) {
                merged.subjects.push(localSubject);
            } else {
                if (new Date(localSubject.updatedAt || 0) > new Date(remoteSubject.updatedAt || 0)) {
                    Object.assign(remoteSubject, localSubject);
                }

                for (const localNote of localSubject.notes) {
                    const remoteNote = remoteSubject.notes.find(n => n.id === localNote.id);

                    if (!remoteNote) {
                        remoteSubject.notes.push(localNote);
                    } else {
                        if (new Date(localNote.updatedAt || 0) > new Date(remoteNote.updatedAt || 0)) {
                            Object.assign(remoteNote, localNote);
                        }
                    }
                }
            }
        }

        for (const localEvent of localData.events) {
            const remoteEvent = merged.events.find(e => e.id === localEvent.id);

            if (!remoteEvent) {
                merged.events.push(localEvent);
            } else if (new Date(localEvent.updatedAt || 0) > new Date(remoteEvent.updatedAt || 0)) {
                Object.assign(remoteEvent, localEvent);
            }
        }

        return merged;
    }

    async uploadData(data) {
        await this.createOrUpdateFile(
            'data/subjects.json',
            JSON.stringify(data.subjects, null, 2),
            `Sync subjects - ${new Date().toISOString()}`
        );

        await this.createOrUpdateFile(
            'data/events.json',
            JSON.stringify(data.events, null, 2),
            `Sync events - ${new Date().toISOString()}`
        );

        await this.createOrUpdateFile(
            'data/settings.json',
            JSON.stringify(data.settings, null, 2),
            `Sync settings - ${new Date().toISOString()}`
        );

        const noteIds = [];

        for (const subject of data.subjects) {
            for (const note of subject.notes) {
                noteIds.push(note.id);

                const noteData = {
                    ...note,
                    subjectId: subject.id
                };

                await this.createOrUpdateFile(
                    `data/notes/${note.id}.json`,
                    JSON.stringify(noteData, null, 2),
                    `Update note: ${note.title}`
                );
            }
        }

        await this.createOrUpdateFile(
            'data/notes-index.json',
            JSON.stringify(noteIds, null, 2),
            'Update notes index'
        );
    }

    async getFile(path) {
        const response = await fetch(`https://api.github.com/repos/${this.username}/${this.repoName}/contents/${path}`, {
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Failed to get file ${path}: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: atob(data.content),
            sha: data.sha
        };
    }

    async createOrUpdateFile(path, content, message) {
        const existingFile = await this.getFile(path);

        const body = {
            message,
            content: btoa(encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))))
        };

        if (existingFile) {
            body.sha = existingFile.sha;
        }

        const response = await fetch(`https://api.github.com/repos/${this.username}/${this.repoName}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Failed to update file ${path}: ${response.status}`);
        }

        return await response.json();
    }

    async getUserInfo() {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get user info: ${response.status}`);
        }

        return await response.json();
    }

    updateSyncUI() {
        const syncButton = document.getElementById('syncButton');
        const syncStatus = document.getElementById('syncStatus');

        if (!syncButton) return;

        if (!this.isAuthenticated) {
            syncButton.innerHTML = '<i class="fab fa-github"></i> Conectar GitHub';
            syncButton.onclick = () => this.authenticate();
            if (syncStatus) syncStatus.textContent = 'No conectado';
        } else if (this.syncInProgress) {
            syncButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
            syncButton.disabled = true;
        } else {
            syncButton.innerHTML = '<i class="fas fa-sync"></i> Sincronizar';
            syncButton.disabled = false;
            syncButton.onclick = () => this.triggerSync();

            if (syncStatus) {
                const lastSync = this.lastSyncTime ?
                    new Date(this.lastSyncTime).toLocaleString() :
                    'Nunca';
                syncStatus.textContent = `Conectado como ${this.username} • Última sync: ${lastSync}`;
            }
        }
    }

    async triggerSync() {
        if (window.cuadernoDigital) {
            const result = await this.syncData(
                window.cuadernoDigital.subjects,
                window.cuadernoDigital.events,
                this.getLocalSettings()
            );

            if (result) {
                window.cuadernoDigital.subjects = result.subjects;
                window.cuadernoDigital.events = result.events;
                window.cuadernoDigital.saveCarpeta();
                window.cuadernoDigital.renderSubjects();
            }
        }
    }

    getLocalSettings() {
        return {
            theme: document.documentElement.getAttribute('data-theme') || 'dark',
            fontSize: getComputedStyle(document.documentElement).getPropertyValue('--font-size') || '16px',
            fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-family') || 'Inter'
        };
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    showSuccess(message) {
        if (window.cuadernoDigital && window.cuadernoDigital.showToast) {
            window.cuadernoDigital.showToast(message, 'success');
        }
    }

    showError(message) {
        if (window.cuadernoDigital && window.cuadernoDigital.showToast) {
            window.cuadernoDigital.showToast(message, 'error');
        }
    }
}

window.githubSync = new GitHubSync();