import { sanitizeText, cleanNoteContent, generateId } from '../utils/helpers.js';

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

export const loadAllData = () => {
    try {
        const rawSubjects = localStorage.getItem(STORAGE_KEY);
        const rawEvents = localStorage.getItem(EVENTS_KEY);
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        const rawDeletedItems = localStorage.getItem(DELETED_ITEMS_KEY);

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

export const saveSubjects = (subjects) => {
    console.debug(`Guardando materias (${subjects.length})...`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
};

export const saveEvents = (events) => {
    console.debug(`Guardando eventos (${events.length})...`);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

export const saveSettings = (settings) => {
    console.debug('Guardando nueva configuración.');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};


export const loadDeletedItems = () => {
    const raw = localStorage.getItem(DELETED_ITEMS_KEY);
    return raw ? JSON.parse(raw) : { notes: [], subjects: [] };
};

export const saveDeletedItems = (deletedItems) => {
    localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(deletedItems));
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
