import { sanitizeText, cleanNoteContent, generateId } from '../utils/helpers.js';

const STORAGE_KEY = 'cuadernoDigital';
const EVENTS_KEY = 'cuadernoEvents';
const SETTINGS_KEY = 'escribaSettings';
const DELETED_ITEMS_KEY = 'escribaDeletedItems';

export class StorageService {
  constructor() {
    this.nodeFs = null;
    this.nodePath = null;
    this.nodeOs = null;
    this.ipcRenderer = null;
    this.initElectron();
  }

  initElectron() {
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

  isElectron() {
    return !!(this.nodeFs && this.nodePath);
  }

  isLocalDiskMode() {
    try {
      const rawSettings = localStorage.getItem(SETTINGS_KEY);
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        return parsed.storageMode === 'local';
      }
    } catch (e) { }
    return localStorage.getItem('storage_mode') === 'local';
  }

  getDefaultPath() {
    if (!this.isElectron()) {
      return 'Dispositivo Local (Navegador Web)';
    }

    const os = this.nodeOs;
    const path = this.nodePath;
    const platform = (typeof process !== 'undefined' && process.platform) || (os ? os.platform() : 'linux');

    if (platform === 'win32') {
      const appData = (typeof process !== 'undefined' && process.env?.APPDATA) || (os ? path.join(os.homedir(), 'AppData', 'Roaming') : '');
      return path.join(appData, 'Escriba', 'data');
    } else if (platform === 'darwin') {
      const home = os ? os.homedir() : '';
      return path.join(home, 'Library', 'Application Support', 'Escriba', 'data');
    } else {
      const configHome = (typeof process !== 'undefined' && process.env?.XDG_CONFIG_HOME) || (os ? path.join(os.homedir(), '.config') : '');
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

  async selectLocalFolder() {
    if (this.ipcRenderer) {
      try {
        const selectedPath = await this.ipcRenderer.invoke('select-local-folder');
        if (selectedPath) {
          this.setCustomPath(selectedPath);
          return selectedPath;
        }
      } catch (e) {
        console.error('Error selecting local folder via IPC:', e);
      }
    }
    return null;
  }

  async openLocalFolder(folderPath) {
    const targetPath = folderPath || this.getActivePath();
    if (this.ipcRenderer) {
      try {
        await this.ipcRenderer.invoke('open-local-folder', targetPath);
        return true;
      } catch (e) {
        console.error('Error opening local folder via IPC:', e);
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
    if (!this.isElectron()) return;
    if (!this.nodeFs.existsSync(dirPath)) {
      this.nodeFs.mkdirSync(dirPath, { recursive: true });
    }
  }

  saveToDisk(data = {}) {
    if (!this.isElectron()) return false;

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
            const noteData = { ...note, subjectId: subject.id };
            this.nodeFs.writeFileSync(notePath, JSON.stringify(noteData, null, 2), 'utf8');
          }
        }
      }

      this.nodeFs.writeFileSync(
        this.nodePath.join(targetDir, 'notes-index.json'),
        JSON.stringify(noteIds, null, 2),
        'utf8'
      );

      return true;
    } catch (error) {
      console.error('StorageService: Error saving to local disk:', error);
      return false;
    }
  }

  loadFromDisk() {
    if (!this.isElectron()) return null;

    try {
      const targetDir = this.getActivePath();
      const subjectsPath = this.nodePath.join(targetDir, 'subjects.json');

      if (!this.nodeFs.existsSync(subjectsPath)) {
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

      return { subjects, events, settings, deletedItems };
    } catch (error) {
      console.error('StorageService: Error loading from disk:', error);
      return null;
    }
  }

  getDefaultData() {
    return {
      subjects: [
        {
          id: 'sub-welcome',
          name: 'Bienvenido a Escriba',
          code: 'GUIA',
          professor: 'Escriba Team',
          color: '#4361ee',
          schedule: [],
          notes: [
            {
              id: 'note-welcome-1',
              title: 'Primeros pasos con Escriba',
              content: `<h2>¡Bienvenido a tu nueva carpeta digital! 🚀</h2><p>Escriba te permite organizar tus materias y apuntes de manera simple y rápida.</p><ul><li><b>Materias:</b> Organizá tus notas con colores y horarios de cursada.</li><li><b>Editor enriquecido:</b> Usá fórmulas en LaTeX, bloques de código interactivos y diagramas UML.</li><li><b>Sincronización:</b> Conectá con GitHub o guardá en una carpeta local de tu disco.</li></ul><p>¡Hacé clic en <b>Nueva Materia</b> o en <b>Nuevo Apunte</b> para empezar!</p>`,
              subjectId: 'sub-welcome',
              favorite: true,
              tags: ['guía'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ],
      events: [],
      deletedItems: []
    };
  }

  loadData() {
    try {
      if (this.isLocalDiskMode() && this.isElectron()) {
        const diskData = this.loadFromDisk();
        if (diskData && Array.isArray(diskData.subjects)) {
          const formattedDeleted = Array.isArray(diskData.deletedItems)
            ? diskData.deletedItems
            : [];

          localStorage.setItem(STORAGE_KEY, JSON.stringify(diskData.subjects));
          localStorage.setItem(EVENTS_KEY, JSON.stringify(diskData.events));
          if (diskData.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(diskData.settings));
          localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(formattedDeleted));
          return {
            subjects: diskData.subjects,
            events: diskData.events,
            deletedItems: formattedDeleted
          };
        }
      }

      const rawSubjects = localStorage.getItem(STORAGE_KEY);
      const rawEvents = localStorage.getItem(EVENTS_KEY);
      const rawDeletedItems = localStorage.getItem(DELETED_ITEMS_KEY);

      let subjects = rawSubjects ? JSON.parse(rawSubjects) : null;
      let events = rawEvents ? JSON.parse(rawEvents) : [];
      let deletedItems = [];

      try {
        if (rawDeletedItems) {
          const parsed = JSON.parse(rawDeletedItems);
          if (Array.isArray(parsed)) {
            deletedItems = parsed;
          }
        }
      } catch (e) {
        deletedItems = [];
      }

      if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        const defaultData = this.getDefaultData();
        this.saveData(defaultData.subjects, defaultData.events, defaultData.deletedItems);
        return defaultData;
      }

      return { subjects, events, deletedItems };
    } catch (e) {
      console.error('Error loading data from storage:', e);
      return this.getDefaultData();
    }
  }

  saveData(subjects, events = [], deletedItems = []) {
    try {
      const deletedArray = Array.isArray(deletedItems) ? deletedItems : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
      localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(deletedArray));

      if (this.isLocalDiskMode() && this.isElectron()) {
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        this.saveToDisk({
          subjects,
          events,
          settings: rawSettings ? JSON.parse(rawSettings) : {},
          deletedItems: deletedArray
        });
      }
    } catch (e) {
      console.error('Error saving data:', e);
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return {
      theme: 'dark',
      fontFamily: 'Inter',
      fontSize: 16,
      autoSave: true,
      autoSync: true,
      expandSubjects: true,
      showWelcome: true,
      storageMode: 'local'
    };
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      if (settings.storageMode) {
        localStorage.setItem('storage_mode', settings.storageMode);
      }
      if (this.isLocalDiskMode() && this.isElectron()) {
        const rawSubjects = localStorage.getItem(STORAGE_KEY);
        const rawEvents = localStorage.getItem(EVENTS_KEY);
        const rawDeleted = localStorage.getItem(DELETED_ITEMS_KEY);
        this.saveToDisk({
          subjects: rawSubjects ? JSON.parse(rawSubjects) : [],
          events: rawEvents ? JSON.parse(rawEvents) : [],
          settings,
          deletedItems: rawDeleted ? JSON.parse(rawDeleted) : { notes: [], subjects: [] }
        });
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }
}

export const storageService = new StorageService();
