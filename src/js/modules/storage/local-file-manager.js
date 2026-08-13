export class LocalFileManager {
    constructor() {
        this.nodeFs = null;
        this.nodePath = null;
        this.nodeOs = null;
        this.ipcRenderer = null;
        this.initNodeModules();
    }

    initNodeModules() {
        if (typeof window !== 'undefined' && window.require) {
            try {
                this.nodeFs = window.require('fs');
                this.nodePath = window.require('path');
                this.nodeOs = window.require('os');
                const electron = window.require('electron');
                if (electron && electron.ipcRenderer) {
                    this.ipcRenderer = electron.ipcRenderer;
                }
            } catch (e) {
                console.warn('Node modules not available in window:', e);
            }
        }
    }

    isAvailable() {
        return !!(this.nodeFs && this.nodePath);
    }

    getDefaultPath() {
        if (!this.isAvailable()) {
            return 'Dispositivo Local (Navegador Web)';
        }

        const os = this.nodeOs;
        const path = this.nodePath;
        const platform = process.platform || (os ? os.platform() : 'linux');

        if (platform === 'win32') {
            const appData = process.env.APPDATA || (os ? path.join(os.homedir(), 'AppData', 'Roaming') : '');
            return path.join(appData, 'Escriba', 'data');
        } else if (platform === 'darwin') {
            const home = os ? os.homedir() : '';
            return path.join(home, 'Library', 'Application Support', 'Escriba', 'data');
        } else {
            const configHome = process.env.XDG_CONFIG_HOME || (os ? path.join(os.homedir(), '.config') : '');
            return path.join(configHome, 'escriba', 'data');
        }
    }

    getCustomPath() {
        return localStorage.getItem('local_storage_folder_path') || null;
    }

    setCustomPath(customPath) {
        if (customPath) {
            localStorage.setItem('local_storage_folder_path', customPath);
        } else {
            localStorage.removeItem('local_storage_folder_path');
        }
    }

    getActivePath() {
        return this.getCustomPath() || this.getDefaultPath();
    }

    async selectCustomFolder() {
        if (this.ipcRenderer) {
            try {
                const selectedPath = await this.ipcRenderer.invoke('select-local-folder');
                if (selectedPath) {
                    this.setCustomPath(selectedPath);
                    return selectedPath;
                }
            } catch (e) {
                console.error('Error selecting folder via IPC:', e);
            }
        }
        return null;
    }

    async openLocalDirectory() {
        const targetPath = this.getActivePath();
        if (this.ipcRenderer) {
            try {
                await this.ipcRenderer.invoke('open-local-folder', targetPath);
                return true;
            } catch (e) {
                console.error('Error opening folder via IPC:', e);
            }
        }
        if (this.nodeFs && this.nodePath) {
            try {
                if (!this.nodeFs.existsSync(targetPath)) {
                    this.nodeFs.mkdirSync(targetPath, { recursive: true });
                }
            } catch (e) {
                console.error('Error creating directory:', e);
            }
        }
        return false;
    }

    ensureDirSync(dirPath) {
        if (!this.isAvailable()) return;
        if (!this.nodeFs.existsSync(dirPath)) {
            this.nodeFs.mkdirSync(dirPath, { recursive: true });
        }
    }

    saveAllData(data = {}) {
        if (!this.isAvailable()) {
            console.warn('LocalFileManager: Node fs is not available, skipping local file save.');
            return false;
        }

        try {
            const targetDir = this.getActivePath();
            const notesDir = this.nodePath.join(targetDir, 'notes');

            this.ensureDirSync(targetDir);
            this.ensureDirSync(notesDir);

            const subjects = data.subjects || [];
            const events = data.events || [];
            const settings = data.settings || {};
            const deletedItems = data.deletedItems || { notes: [], subjects: [] };

            this.nodeFs.writeFileSync(
                this.nodePath.join(targetDir, 'subjects.json'),
                JSON.stringify(subjects, null, 2),
                'utf8'
            );
            this.nodeFs.writeFileSync(
                this.nodePath.join(targetDir, 'events.json'),
                JSON.stringify(events, null, 2),
                'utf8'
            );
            this.nodeFs.writeFileSync(
                this.nodePath.join(targetDir, 'settings.json'),
                JSON.stringify(settings, null, 2),
                'utf8'
            );
            this.nodeFs.writeFileSync(
                this.nodePath.join(targetDir, 'deleted-items.json'),
                JSON.stringify(deletedItems, null, 2),
                'utf8'
            );

            const noteIds = [];
            for (const subject of subjects) {
                if (Array.isArray(subject.notes)) {
                    for (const note of subject.notes) {
                        noteIds.push(note.id);
                        const notePath = this.nodePath.join(notesDir, `${note.id}.json`);
                        const noteData = {
                            ...note,
                            subjectId: subject.id
                        };
                        this.nodeFs.writeFileSync(notePath, JSON.stringify(noteData, null, 2), 'utf8');
                    }
                }
            }

            this.nodeFs.writeFileSync(
                this.nodePath.join(targetDir, 'notes-index.json'),
                JSON.stringify(noteIds, null, 2),
                'utf8'
            );

            console.log(`LocalFileManager: Datos guardados con éxito en ${targetDir}`);
            return true;
        } catch (error) {
            console.error('LocalFileManager: Error guardando datos en disco local:', error);
            return false;
        }
    }

    loadAllData() {
        if (!this.isAvailable()) {
            return null;
        }

        try {
            const targetDir = this.getActivePath();
            const subjectsPath = this.nodePath.join(targetDir, 'subjects.json');

            if (!this.nodeFs.existsSync(subjectsPath)) {
                console.log(`LocalFileManager: No existe ${subjectsPath}, omitiendo carga de disco.`);
                return null;
            }

            const rawSubjects = this.nodeFs.readFileSync(subjectsPath, 'utf8');
            const subjects = JSON.parse(rawSubjects);

            let events = [];
            const eventsPath = this.nodePath.join(targetDir, 'events.json');
            if (this.nodeFs.existsSync(eventsPath)) {
                events = JSON.parse(this.nodeFs.readFileSync(eventsPath, 'utf8'));
            }

            let settings = null;
            const settingsPath = this.nodePath.join(targetDir, 'settings.json');
            if (this.nodeFs.existsSync(settingsPath)) {
                settings = JSON.parse(this.nodeFs.readFileSync(settingsPath, 'utf8'));
            }

            let deletedItems = { notes: [], subjects: [] };
            const deletedPath = this.nodePath.join(targetDir, 'deleted-items.json');
            if (this.nodeFs.existsSync(deletedPath)) {
                deletedItems = JSON.parse(this.nodeFs.readFileSync(deletedPath, 'utf8'));
            }

            console.log(`LocalFileManager: Datos cargados desde ${targetDir}`);
            return {
                subjects,
                events,
                settings,
                deletedItems
            };
        } catch (error) {
            console.error('LocalFileManager: Error cargando datos de disco local:', error);
            return null;
        }
    }
}

export const localFileManager = new LocalFileManager();
