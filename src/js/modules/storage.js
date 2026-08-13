import { sanitizeText, cleanNoteContent, generateId } from '../utils/helpers.js';
import { localFileManager } from './storage/local-file-manager.js';

const STORAGE_KEY = 'cuadernoDigital';
const EVENTS_KEY = 'cuadernoEvents';
const SETTINGS_KEY = 'escribaSettings';
const DELETED_ITEMS_KEY = 'escribaDeletedItems';

export const migrateNoteIds = (subjects) => {
    if (!Array.isArray(subjects)) return subjects;

    const idMap = new Map();

    subjects.forEach(subject => {
        if (Array.isArray(subject.notes)) {
            subject.notes.forEach(note => {
                if (/^\d+$/.test(note.id)) {
                    const newId = generateId();
                    idMap.set(note.id, newId);
                    note.id = newId;
                }
            });
        }
    });

    if (idMap.size === 0) return subjects;

    subjects.forEach(subject => {
        if (Array.isArray(subject.notes)) {
            subject.notes.forEach(note => {
                if (note.content && typeof note.content === 'string') {
                    let updatedContent = note.content;
                    idMap.forEach((newId, oldId) => {
                        const regex = new RegExp(`data-note-id=["']${oldId}["']`, 'g');
                        updatedContent = updatedContent.replace(regex, `data-note-id="${newId}"`);
                    });
                    note.content = updatedContent;
                }
            });
        }
    });

    return subjects;
};

export const validateAndCleanSubjects = (subjects) => {
    if (!Array.isArray(subjects)) return [];

    const migratedSubjects = migrateNoteIds(subjects);

    return migratedSubjects.map(subject => ({
        ...subject,
        name: sanitizeText(subject.name || 'Materia sin nombre'),
        code: subject.code ? sanitizeText(subject.code) : subject.code,
        professor: subject.professor ? sanitizeText(subject.professor) : subject.professor,
        archived: !!subject.archived,
        notes: Array.isArray(subject.notes) ? subject.notes.map(note => ({
            ...note,
            title: sanitizeText(note.title || 'Apunte sin título'),
            content: cleanNoteContent(note.content || '')
        })) : [],
        schedule: Array.isArray(subject.schedule) ? subject.schedule : []
    }));
};

export const validateAndCleanEvents = (events) => {
    if (!Array.isArray(events)) return [];

    return events.map(event => ({
        ...event,
        title: sanitizeText(event.title || 'Evento sin título'),
        notes: event.notes ? sanitizeText(event.notes) : event.notes
    }));
};

const isLocalDiskMode = () => {
    try {
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        if (rawSettings) {
            const parsed = JSON.parse(rawSettings);
            return parsed.storageMode === 'local';
        }
    } catch (e) { }
    return localStorage.getItem('storage_mode') === 'local';
};

export const loadAllData = () => {
    try {
        let rawSubjects = localStorage.getItem(STORAGE_KEY);
        let rawEvents = localStorage.getItem(EVENTS_KEY);
        let rawSettings = localStorage.getItem(SETTINGS_KEY);
        let rawDeletedItems = localStorage.getItem(DELETED_ITEMS_KEY);

        if (isLocalDiskMode() && localFileManager.isAvailable()) {
            const diskData = localFileManager.loadAllData();
            if (diskData && Array.isArray(diskData.subjects)) {
                console.log('Cargando datos primarios desde Disco Local (%appdata% / ~/.config)');
                const data = {
                    subjects: validateAndCleanSubjects(diskData.subjects),
                    events: validateAndCleanEvents(diskData.events),
                    settings: diskData.settings || (rawSettings ? JSON.parse(rawSettings) : null),
                    deletedItems: diskData.deletedItems || { notes: [], subjects: [] }
                };

                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.subjects));
                localStorage.setItem(EVENTS_KEY, JSON.stringify(data.events));
                if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
                localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(data.deletedItems));

                return data;
            }
        }

        console.log('Cargando todos los datos desde localStorage...');

        const data = {
            subjects: rawSubjects ? validateAndCleanSubjects(JSON.parse(rawSubjects)) : [],
            events: rawEvents ? validateAndCleanEvents(JSON.parse(rawEvents)) : [],
            settings: rawSettings ? JSON.parse(rawSettings) : null,
            deletedItems: rawDeletedItems ? JSON.parse(rawDeletedItems) : { notes: [], subjects: [] }
        };

        console.log(`Carga completada: ${data.subjects.length} materias, ${data.events.length} eventos.`);
        return data;
    } catch (e) {
        console.error('Error fatal al cargar datos de localStorage:', e);
        return { subjects: [], events: [], settings: null };
    }
};

export const syncToLocalDiskIfNeeded = () => {
    if (isLocalDiskMode() && localFileManager.isAvailable()) {
        const rawSubjects = localStorage.getItem(STORAGE_KEY);
        const rawEvents = localStorage.getItem(EVENTS_KEY);
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        const rawDeletedItems = localStorage.getItem(DELETED_ITEMS_KEY);

        localFileManager.saveAllData({
            subjects: rawSubjects ? JSON.parse(rawSubjects) : [],
            events: rawEvents ? JSON.parse(rawEvents) : [],
            settings: rawSettings ? JSON.parse(rawSettings) : {},
            deletedItems: rawDeletedItems ? JSON.parse(rawDeletedItems) : { notes: [], subjects: [] }
        });
    }
};

export const saveSubjects = (subjects) => {
    console.debug(`Guardando materias (${subjects.length})...`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    syncToLocalDiskIfNeeded();
};

export const saveEvents = (events) => {
    console.debug(`Guardando eventos (${events.length})...`);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    syncToLocalDiskIfNeeded();
};

export const saveSettings = (settings) => {
    console.debug('Guardando nueva configuración.');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    syncToLocalDiskIfNeeded();
};

export const loadDeletedItems = () => {
    const raw = localStorage.getItem(DELETED_ITEMS_KEY);
    return raw ? JSON.parse(raw) : { notes: [], subjects: [] };
};

export const saveDeletedItems = (deletedItems) => {
    console.debug('Guardando elementos eliminados.');
    localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(deletedItems));
    syncToLocalDiskIfNeeded();
};

export const addDeletedItem = (id, type) => {
    const deletedItems = loadDeletedItems();
    if (type === 'note') {
        if (!deletedItems.notes.includes(id)) deletedItems.notes.push(id);
    } else if (type === 'subject') {
        if (!deletedItems.subjects.includes(id)) deletedItems.subjects.push(id);
    }
    saveDeletedItems(deletedItems);
};

export const clearDeletedItems = (ids, type) => {
    const deletedItems = loadDeletedItems();
    if (type === 'note' && Array.isArray(ids)) {
        deletedItems.notes = deletedItems.notes.filter(id => !ids.includes(id));
    } else if (type === 'subject' && Array.isArray(ids)) {
        deletedItems.subjects = deletedItems.subjects.filter(id => !ids.includes(id));
    }
    saveDeletedItems(deletedItems);
};

export const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EVENTS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(DELETED_ITEMS_KEY);
};