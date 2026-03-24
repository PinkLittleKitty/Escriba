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
                                <button class="btn btn-primary" onclick="window.open('https://github.com/settings/tokens/new?scopes=repo,gist&description=Escriba%20Notes%20Sync', '_blank')">
                                    <i class="fab fa-github"></i> Crear Token en GitHub
                                </button>
                                <small class="help-text">Se abrirá GitHub con los permisos correctos preseleccionados (repo + gist)</small>
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
            connectBtn.disabled = !tokenInput.value || !tokenInput.value.startsWith('ghp_');
        });
        
        toggleBtn.addEventListener('click', () => {
            const isPassword = tokenInput.type === 'password';
            tokenInput.type = isPassword ? 'text' : 'password';
            toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
        
        connectBtn.addEventListener('click', () => {
            this.connectWithToken(tokenInput.value);
        });
        
        tokenInput.focus();
    }

    async connectWithToken(token) {
        if (!token || !token.startsWith('ghp_')) {
            alert('Por favor, ingresa un token válido que comience con "ghp_"');
            return;
        }

        try {
            this.accessToken = token;
            const userInfo = await this.getUserInfo();
            
            this.username = userInfo.login;
            this.isAuthenticated = true;
            
            localStorage.setItem('github_access_token', this.accessToken);
            localStorage.setItem('github_username', this.username);
            
            if (this.tokenModal) {
                this.tokenModal.remove();
            }
            
            this.updateSyncUI();
            this.showSuccess(`Conectado exitosamente como ${this.username}`);
            
        } catch (error) {
            console.error('Error connecting with token:', error);
            this.showError('Error al conectar con GitHub. Verifica que el token sea válido.');
            this.accessToken = null;
            this.username = null;
            this.isAuthenticated = false;
            localStorage.removeItem('github_access_token');
            localStorage.removeItem('github_username');
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
                return true;
            }

            if (!response.ok) {
                throw new Error(`Error checking repository: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error ensuring repository:', error);
            throw error;
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
            const localData = { subjects: cuadernoData, events, settings };
            const remoteData = await this.getRemoteData();
            const mergedData = await this.mergeData(localData, remoteData);

            await this.uploadData(mergedData);

            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('last_sync_time', this.lastSyncTime);

            this.showSuccess('Sincronización completada');
            return mergedData;

        } catch (error) {
            console.error('Sync failed:', error);
            this.showError(`Error de sincronización: ${error.message}`);
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
            try {
                const subjectsFile = await this.getFile('data/subjects.json');
                if (subjectsFile && subjectsFile.content) {
                    data.subjects = JSON.parse(subjectsFile.content);
                }
            } catch (error) {
                console.log('No subjects file found, using empty array');
            }

            try {
                const eventsFile = await this.getFile('data/events.json');
                if (eventsFile && eventsFile.content) {
                    data.events = JSON.parse(eventsFile.content);
                }
            } catch (error) {
                console.log('No events file found, using empty array');
            }

            try {
                const settingsFile = await this.getFile('data/settings.json');
                if (settingsFile && settingsFile.content) {
                    data.settings = JSON.parse(settingsFile.content);
                }
            } catch (error) {
                console.log('No settings file found, using empty object');
            }

        } catch (error) {
            console.error('Error getting remote data:', error);
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
            const existingIndex = merged.subjects.findIndex(s => s.id === localSubject.id);
            if (existingIndex >= 0) {
                const existing = merged.subjects[existingIndex];
                if (new Date(localSubject.lastModified || 0) > new Date(existing.lastModified || 0)) {
                    merged.subjects[existingIndex] = localSubject;
                }
            } else {
                merged.subjects.push(localSubject);
            }
        }

        for (const localEvent of localData.events) {
            const existingIndex = merged.events.findIndex(e => e.id === localEvent.id);
            if (existingIndex >= 0) {
                merged.events[existingIndex] = localEvent;
            } else {
                merged.events.push(localEvent);
            }
        }

        return merged;
    }

    async uploadData(data, forceUpdate = false) {
        const cleanData = this.validateAndCleanData(data);
        
        await this.ensureRepository();
        
        const updateFile = async (path, content, message, retries = 2) => {
            for (let attempt = 1; attempt <= retries + 1; attempt++) {
                try {
                    if (forceUpdate) {
                        await this.createOrUpdateFile(path, content, true);
                    } else {
                        await this.createOrUpdateFile(path, content, message);
                    }
                    return;
                } catch (error) {
                    console.log(`Intento ${attempt} falló para ${path}:`, error.message);
                    
                    if (attempt <= retries && error.message.includes('409')) {
                        console.log(`Reintentando ${path} en 1 segundo...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    
                    throw error;
                }
            }
        };
        
        try {
            console.log('Iniciando upload de datos...');
            
            await updateFile(
                'data/subjects.json',
                JSON.stringify(cleanData.subjects, null, 2),
                `Sync subjects - ${new Date().toISOString()}`
            );

            await updateFile(
                'data/events.json',
                JSON.stringify(cleanData.events, null, 2),
                `Sync events - ${new Date().toISOString()}`
            );

            await updateFile(
                'data/settings.json',
                JSON.stringify(cleanData.settings, null, 2),
                `Sync settings - ${new Date().toISOString()}`
            );

            const noteIds = [];

            for (const subject of cleanData.subjects) {
                for (const note of subject.notes) {
                    noteIds.push(note.id);

                    const noteData = {
                        ...note,
                        subjectId: subject.id
                    };

                    await updateFile(
                        `data/notes/${note.id}.json`,
                        JSON.stringify(noteData, null, 2),
                        `Update note: ${note.title}`
                    );
                }
            }

            await updateFile(
                'data/notes-index.json',
                JSON.stringify(noteIds, null, 2),
                'Update notes index'
            );
            
            console.log('Upload de datos completado exitosamente');
            
        } catch (error) {
            console.error('Error durante el upload de datos:', error);
            throw error;
        }
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
            content: this.base64ToUtf8(data.content),
            sha: data.sha
        };
    }

    async createOrUpdateFile(path, content, messageOrForce, force = false) {
        let message, forceUpdate;
        if (typeof messageOrForce === 'boolean') {
            forceUpdate = messageOrForce;
            message = `Actualización ${forceUpdate ? 'forzada' : 'automática'} de ${path}`;
        } else {
            message = messageOrForce || `Actualización de ${path}`;
            forceUpdate = force;
        }

        let existingFile = null;
        
        if (!forceUpdate) {
            existingFile = await this.getFile(path);
        } else {
            try {
                existingFile = await this.getFile(path);
            } catch (error) {
                console.log(`Archivo ${path} no existe, creando nuevo`);
            }
        }

        let cleanContent = content;
        try {
            cleanContent = this.sanitizeFileContent(content);
            
            if (path.endsWith('.json')) {
                const parsed = JSON.parse(cleanContent);
                cleanContent = JSON.stringify(parsed, null, 2);
            }
        } catch (error) {
            console.warn('Content validation failed, using original:', error);
        }

        const body = {
            message,
            content: this.utf8ToBase64(cleanContent)
        };

        if (existingFile && existingFile.sha) {
            body.sha = existingFile.sha;
        }

        let response = await fetch(`https://api.github.com/repos/${this.username}/${this.repoName}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (response.status === 409) {
            console.log(`Conflicto 409 detectado para ${path}, refrescando SHA...`);
            
            try {
                const latestFile = await this.getFile(path);
                if (latestFile && latestFile.sha) {
                    body.sha = latestFile.sha;
                    
                    response = await fetch(`https://api.github.com/repos/${this.username}/${this.repoName}/contents/${path}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${this.accessToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    });
                    
                    console.log(`Reintento con SHA actualizado: ${response.status}`);
                }
            } catch (retryError) {
                console.error('Error al reintentar después del conflicto 409:', retryError);
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update file ${path}: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    sanitizeFileContent(content) {
        if (!content || typeof content !== 'string') return content;
        
        let cleaned = content.normalize('NFC');
        
        cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
        
        return cleaned;
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
        const githubStatus = document.getElementById('githubStatus');
        const githubStatusText = document.getElementById('githubStatusText');

        if (!githubStatus || !githubStatusText) return;

        githubStatus.className = 'github-status';

        if (!this.isAuthenticated) {
            githubStatus.classList.add('disconnected');
            githubStatusText.textContent = 'No conectado';
            githubStatus.title = 'Conectá GitHub para sincronizar tus apuntes';
            if (syncButton) {
                syncButton.innerHTML = '<i class="fab fa-github"></i> Conectar GitHub';
                syncButton.disabled = false;
            }
        } else if (this.syncInProgress) {
            githubStatus.classList.add('syncing');
            githubStatusText.textContent = 'Sincronizando...';
            githubStatus.title = 'Sincronizando datos con GitHub...';
            if (syncButton) {
                syncButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
                syncButton.disabled = true;
            }
        } else {
            githubStatus.classList.add('connected');
            githubStatusText.textContent = `${this.username}`;
            const lastSync = this.lastSyncTime ?
                new Date(this.lastSyncTime).toLocaleString() :
                'Nunca';
            githubStatus.title = `Conectado como ${this.username}\nÚltima sincronización: ${lastSync}`;
            if (syncButton) {
                syncButton.innerHTML = '<i class="fas fa-sync"></i> Sincronizar';
                syncButton.disabled = false;
            }
        }
        
        this.updateSyncButtons();
    }

    async triggerSync() {
        if (window.cuadernoDigital) {
            const result = await this.syncData(
                window.cuadernoDigital.subjects,
                window.cuadernoDigital.events,
                window.cuadernoDigital.getAppSettings()
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

    utf8ToBase64(str) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            return btoa(String.fromCharCode(...data));
        } catch (error) {
            console.warn('UTF-8 encoding failed, using fallback:', error);
            return btoa(unescape(encodeURIComponent(str)));
        }
    }

    base64ToUtf8(str) {
        try {
            const binaryString = atob(str);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decoder = new TextDecoder();
            return decoder.decode(bytes);
        } catch (error) {
            console.warn('UTF-8 decoding failed, using fallback:', error);
            try {
                return decodeURIComponent(escape(atob(str)));
            } catch (fallbackError) {
                console.error('All decoding methods failed:', fallbackError);
                return atob(str);
            }
        }
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    validateAndCleanData(data) {
        return {
            subjects: data.subjects.map(subject => ({
                ...subject,
                name: this.sanitizeText(subject.name),
                code: subject.code ? this.sanitizeText(subject.code) : subject.code,
                professor: subject.professor ? this.sanitizeText(subject.professor) : subject.professor,
                notes: subject.notes.map(note => ({
                    ...note,
                    title: this.sanitizeText(note.title),
                    content: this.cleanNoteContent(note.content)
                }))
            })),
            events: data.events.map(event => ({
                ...event,
                title: this.sanitizeText(event.title),
                notes: event.notes ? this.sanitizeText(event.notes) : event.notes
            })),
            settings: data.settings
        };
    }

    sanitizeText(text) {
        if (!text || typeof text !== 'string') return text;
        
        return text.normalize('NFC');
    }

    cleanNoteContent(content) {
        if (!content || typeof content !== 'string') return content;
        
        let cleaned = content.normalize('NFC');
        
        cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
        
        return cleaned;
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
        
        const githubStatus = document.getElementById('githubStatus');
        const githubStatusText = document.getElementById('githubStatusText');
        
        if (githubStatus && githubStatusText) {
            githubStatus.className = 'github-status error';
            githubStatusText.textContent = 'Error de conexión';
            githubStatus.title = `Error: ${message}\nHaz click para reintentar`;
        }
    }

    getLocalData() {
        try {
            if (window.cuadernoDigital) {
                return {
                    subjects: window.cuadernoDigital.subjects || [],
                    events: window.cuadernoDigital.events || [],
                    settings: window.cuadernoDigital.getAppSettings ? window.cuadernoDigital.getAppSettings() : {}
                };
            }
            
            const subjects = localStorage.getItem('cuadernoDigital');
            const events = localStorage.getItem('cuadernoEvents');
            
            return {
                subjects: subjects ? JSON.parse(subjects) : [],
                events: events ? JSON.parse(events) : [],
                settings: this.getLocalSettings()
            };
        } catch (error) {
            console.error('Error obteniendo datos locales:', error);
            return {
                subjects: [],
                events: [],
                settings: {}
            };
        }
    }

    async forcePush() {
        if (!this.isAuthenticated) {
            this.showError('No estás conectado a GitHub');
            return false;
        }

        if (this.syncInProgress) {
            this.showError('Sincronización en progreso, espera...');
            return false;
        }

        try {
            this.syncInProgress = true;
            this.updateSyncButtons();
            
            const localData = this.getLocalData();
            if (!localData) {
                this.showError('No hay datos locales para subir');
                return false;
            }

            await this.uploadData(localData, true);
            this.showSuccess('Push completado: Datos subidos a GitHub');
            return true;

        } catch (error) {
            console.error('Error en force push:', error);
            this.showError(`Error en push: ${error.message}`);
            return false;
        } finally {
            this.syncInProgress = false;
            this.updateSyncButtons();
        }
    }

    async forcePull() {
        if (!this.isAuthenticated) {
            this.showError('No estás conectado a GitHub');
            return false;
        }

        if (this.syncInProgress) {
            this.showError('Sincronización en progreso, espera...');
            return false;
        }

        try {
            this.syncInProgress = true;
            this.updateSyncButtons();

            const remoteData = await this.getRemoteData();
            if (!remoteData) {
                this.showError('No se pudieron descargar los datos desde GitHub');
                return false;
            }

            localStorage.setItem('cuadernoDigital', JSON.stringify(remoteData.subjects));
            localStorage.setItem('cuadernoEvents', JSON.stringify(remoteData.events));
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('last_sync_time', this.lastSyncTime);

            this.showSuccess('Pull completado: Datos descargados desde GitHub');
            
            if (window.cuadernoDigital) {
                window.cuadernoDigital.subjects = remoteData.subjects;
                window.cuadernoDigital.events = remoteData.events;
                window.cuadernoDigital.saveCarpeta();
                window.cuadernoDigital.renderSubjects();
                window.cuadernoDigital.switchView('subjects');
            }

            return true;

        } catch (error) {
            console.error('Error en force pull:', error);
            this.showError(`Error en pull: ${error.message}`);
            return false;
        } finally {
            this.syncInProgress = false;
            this.updateSyncButtons();
        }
    }

    updateSyncButtons() {
        const pullButton = document.getElementById('pullButton');
        const pushButton = document.getElementById('pushButton');
        const syncButtons = document.getElementById('syncButtons');

        if (this.isAuthenticated) {
            if (syncButtons) syncButtons.style.display = 'flex';
            
            if (pullButton) {
                pullButton.disabled = this.syncInProgress;
                pullButton.innerHTML = this.syncInProgress ? 
                    '<i class="fas fa-spinner fa-spin"></i>' : 
                    '<i class="fas fa-download"></i>';
            }
            
            if (pushButton) {
                pushButton.disabled = this.syncInProgress;
                pushButton.innerHTML = this.syncInProgress ? 
                    '<i class="fas fa-spinner fa-spin"></i>' : 
                    '<i class="fas fa-upload"></i>';
            }
        } else {
            if (syncButtons) syncButtons.style.display = 'none';
        }
    }
}

window.githubSync = new GitHubSync();