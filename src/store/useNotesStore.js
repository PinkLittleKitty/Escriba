import { create } from 'zustand';
import { storageService } from '../services/storageService.js';
import { generateId, sanitizeText, cleanNoteContent } from '../utils/helpers.js';

const initialData = storageService.loadData();

let initialSubjectId = initialData.subjects[0]?.id || null;
let initialNoteId = null;
let initialView = initialData.subjects && initialData.subjects.length > 0 ? 'dashboard' : 'welcome';

export const useNotesStore = create((set, get) => ({
  subjects: initialData.subjects || [],
  events: initialData.events || [],
  deletedItems: Array.isArray(initialData.deletedItems) ? initialData.deletedItems : [],
  deletionTombstones: initialData.deletionTombstones || { notes: [], subjects: [] },
  activeSubjectId: initialSubjectId,
  activeNoteId: null,
  activeView: initialView,

  _persist: () => {
    const { subjects, events, deletedItems, deletionTombstones } = get();
    storageService.saveData(
      subjects,
      events,
      Array.isArray(deletedItems) ? deletedItems : [],
      deletionTombstones || { notes: [], subjects: [] }
    );
  },

  setActiveView: (view) => set({ activeView: view }),

  setActiveNote: (subjectId, noteId) => {
    set({
      activeSubjectId: subjectId,
      activeNoteId: noteId,
      activeView: 'editor'
    });
  },

  setActiveSubject: (subjectId) => {
    set({ activeSubjectId: subjectId });
  },

  addSubject: ({ name, code = '', professor = '', color = '#3b82f6', schedule = [] }) => {
    const newSubject = {
      id: generateId('sub'),
      name: sanitizeText(name) || 'Nueva Materia',
      code: sanitizeText(code),
      professor: sanitizeText(professor),
      color,
      schedule,
      archived: false,
      notes: [],
      createdAt: new Date().toISOString()
    };

    set((state) => {
      const subjects = [...state.subjects, newSubject];
      return { subjects, activeSubjectId: newSubject.id };
    });
    get()._persist();
    return newSubject;
  },

  updateSubject: (id, updates) => {
    set((state) => ({
      subjects: state.subjects.map((sub) => {
        if (sub.id === id) {
          return {
            ...sub,
            ...updates,
            name: updates.name ? sanitizeText(updates.name) : sub.name,
            code: updates.code !== undefined ? sanitizeText(updates.code) : sub.code,
            professor: updates.professor !== undefined ? sanitizeText(updates.professor) : sub.professor
          };
        }
        return sub;
      })
    }));
    get()._persist();
  },

  toggleArchiveSubject: (id) => {
    set((state) => ({
      subjects: state.subjects.map((sub) => {
        if (sub.id === id) {
          return { ...sub, archived: !sub.archived };
        }
        return sub;
      })
    }));
    get()._persist();
  },

  deleteSubject: (id) => {
    const state = get();
    const subjectToDelete = state.subjects.find((s) => s.id === id);
    if (!subjectToDelete) return;

    const newDeletedItem = {
      id: generateId('del'),
      type: 'subject',
      item: subjectToDelete,
      deletedAt: new Date().toISOString()
    };

    const remainingSubjects = state.subjects.filter((s) => s.id !== id);
    let nextSubjectId = remainingSubjects[0]?.id || null;
    let nextNoteId = remainingSubjects[0]?.notes[0]?.id || null;
    let nextView = remainingSubjects.length === 0 ? 'welcome' : state.activeView;
    const currentDeleted = Array.isArray(state.deletedItems) ? state.deletedItems : [];

    const prevTombstones = state.deletionTombstones || { notes: [], subjects: [] };
    const notesInSub = (subjectToDelete.notes || []).map((n) => n.id);
    const updatedTombstones = {
      notes: [...new Set([...(prevTombstones.notes || []), ...notesInSub])],
      subjects: [...new Set([...(prevTombstones.subjects || []), id])]
    };

    set({
      subjects: remainingSubjects,
      deletedItems: [...currentDeleted, newDeletedItem],
      deletionTombstones: updatedTombstones,
      activeSubjectId: state.activeSubjectId === id ? nextSubjectId : state.activeSubjectId,
      activeNoteId: state.activeSubjectId === id ? nextNoteId : state.activeNoteId,
      activeView: nextView
    });
    get()._persist();
  },

  addNote: (subjectId, initialData = {}) => {
    const state = get();
    const targetSubjectId = subjectId || state.activeSubjectId || state.subjects[0]?.id;
    if (!targetSubjectId) return null;

    const nowIso = new Date().toISOString();
    const newNote = {
      id: generateId('note'),
      title: sanitizeText(initialData.title) || 'Apunte sin título',
      content: initialData.content ? cleanNoteContent(initialData.content) : '<p></p>',
      subjectId: targetSubjectId,
      favorite: !!initialData.favorite,
      tags: initialData.tags || [],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    set((state) => {
      const prevTombstones = state.deletionTombstones || { notes: [], subjects: [] };
      return {
        subjects: state.subjects.map((sub) => {
          if (sub.id === targetSubjectId) {
            return {
              ...sub,
              lastModified: nowIso,
              notes: [newNote, ...sub.notes]
            };
          }
          return sub;
        }),
        deletionTombstones: {
          notes: (prevTombstones.notes || []).filter((nId) => nId !== newNote.id),
          subjects: prevTombstones.subjects || []
        },
        activeSubjectId: targetSubjectId,
        activeNoteId: newNote.id,
        activeView: 'editor'
      };
    });
    get()._persist();
    return newNote;
  },

  updateNote: (noteId, updates) => {
    const nowIso = new Date().toISOString();
    set((state) => ({
      subjects: state.subjects.map((sub) => {
        const hasNote = (sub.notes || []).some((n) => n.id === noteId);
        if (!hasNote) return sub;
        return {
          ...sub,
          lastModified: nowIso,
          notes: sub.notes.map((note) => {
            if (note.id === noteId) {
              return {
                ...note,
                ...updates,
                title: updates.title !== undefined ? sanitizeText(updates.title) : note.title,
                content: updates.content !== undefined ? cleanNoteContent(updates.content) : note.content,
                updatedAt: nowIso
              };
            }
            return note;
          })
        };
      })
    }));
    get()._persist();
  },

  deleteNote: (noteId) => {
    const state = get();
    let noteToDelete = null;
    let parentSubjectId = null;

    for (const sub of state.subjects) {
      const found = sub.notes.find((n) => n.id === noteId);
      if (found) {
        noteToDelete = found;
        parentSubjectId = sub.id;
        break;
      }
    }

    if (!noteToDelete) return;

    const nowIso = new Date().toISOString();
    const newDeletedItem = {
      id: generateId('del'),
      type: 'note',
      item: noteToDelete,
      subjectId: parentSubjectId,
      deletedAt: nowIso
    };

    const newSubjects = state.subjects.map((sub) => {
      if (sub.id === parentSubjectId) {
        return {
          ...sub,
          lastModified: nowIso,
          notes: sub.notes.filter((n) => n.id !== noteId)
        };
      }
      return sub;
    });

    let nextNoteId = null;
    const currentSub = newSubjects.find((s) => s.id === state.activeSubjectId);
    if (currentSub && currentSub.notes.length > 0) {
      nextNoteId = currentSub.notes[0].id;
    } else {
      const anySubWithNotes = newSubjects.find((s) => s.notes.length > 0);
      nextNoteId = anySubWithNotes ? anySubWithNotes.notes[0].id : null;
    }

    const currentDeleted = Array.isArray(state.deletedItems) ? state.deletedItems : [];
    const prevTombstones = state.deletionTombstones || { notes: [], subjects: [] };
    const updatedTombstones = {
      notes: [...new Set([...(prevTombstones.notes || []), noteId])],
      subjects: prevTombstones.subjects || []
    };

    set({
      subjects: newSubjects,
      deletedItems: [...currentDeleted, newDeletedItem],
      deletionTombstones: updatedTombstones,
      activeNoteId: state.activeNoteId === noteId ? nextNoteId : state.activeNoteId,
      activeView: !nextNoteId && state.activeView === 'editor' ? 'dashboard' : state.activeView
    });
    get()._persist();
  },

  toggleFavorite: (noteId) => {
    const state = get();
    for (const sub of state.subjects) {
      const note = sub.notes.find((n) => n.id === noteId);
      if (note) {
        get().updateNote(noteId, { favorite: !note.favorite });
        break;
      }
    }
  },

  moveNote: (noteId, targetSubjectId) => {
    const state = get();
    let targetNote = null;
    for (const sub of state.subjects) {
      const found = sub.notes.find((n) => n.id === noteId);
      if (found) {
        targetNote = { ...found, subjectId: targetSubjectId };
        break;
      }
    }

    if (!targetNote) return;

    set((state) => ({
      subjects: state.subjects.map((sub) => {
        if (sub.id === targetSubjectId) {
          return {
            ...sub,
            notes: [targetNote, ...sub.notes.filter((n) => n.id !== noteId)]
          };
        }
        return {
          ...sub,
          notes: sub.notes.filter((n) => n.id !== noteId)
        };
      }),
      activeSubjectId: targetSubjectId
    }));
    get()._persist();
  },

  duplicateNote: (noteId) => {
    const state = get();
    for (const sub of state.subjects) {
      const note = sub.notes.find((n) => n.id === noteId);
      if (note) {
        const copy = {
          ...note,
          id: generateId('note'),
          title: `${note.title} (Copia)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        set((state) => ({
          subjects: state.subjects.map((s) => {
            if (s.id === sub.id) {
              return { ...s, notes: [copy, ...s.notes] };
            }
            return s;
          }),
          activeNoteId: copy.id
        }));
        get()._persist();
        break;
      }
    }
  },

  restoreItem: (deletedItemId) => {
    const state = get();
    const currentDeleted = Array.isArray(state.deletedItems) ? state.deletedItems : [];
    const itemToRestore = currentDeleted.find((d) => d.id === deletedItemId);
    if (!itemToRestore) return;

    const prevTombstones = state.deletionTombstones || { notes: [], subjects: [] };

    if (itemToRestore.type === 'subject') {
      const restoredSubId = itemToRestore.item?.id;
      const notesInSub = (itemToRestore.item?.notes || []).map((n) => n.id);
      set({
        subjects: [...state.subjects, itemToRestore.item],
        deletedItems: currentDeleted.filter((d) => d.id !== deletedItemId),
        deletionTombstones: {
          notes: (prevTombstones.notes || []).filter((nId) => !notesInSub.includes(nId)),
          subjects: (prevTombstones.subjects || []).filter((sId) => sId !== restoredSubId)
        }
      });
    } else if (itemToRestore.type === 'note') {
      const targetSubId = itemToRestore.subjectId;
      const targetSubExists = state.subjects.some((s) => s.id === targetSubId);
      const restoredNoteId = itemToRestore.item?.id;

      set({
        subjects: targetSubExists
          ? state.subjects.map((sub) =>
            sub.id === targetSubId ? { ...sub, notes: [itemToRestore.item, ...sub.notes] } : sub
          )
          : [
            ...state.subjects,
            {
              id: targetSubId || generateId('sub'),
              name: 'Materia Restaurada',
              color: '#3b82f6',
              schedule: [],
              notes: [itemToRestore.item]
            }
          ],
        deletedItems: currentDeleted.filter((d) => d.id !== deletedItemId),
        deletionTombstones: {
          notes: (prevTombstones.notes || []).filter((nId) => nId !== restoredNoteId),
          subjects: prevTombstones.subjects || []
        }
      });
    }
    get()._persist();
  },

  emptyTrash: () => {
    set({ deletedItems: [] });
    get()._persist();
  },

  addEvent: (eventData) => {
    const newEvent = {
      id: generateId('evt'),
      title: sanitizeText(eventData.title) || 'Nuevo Evento',
      date: eventData.date,
      time: eventData.time || '',
      subjectId: eventData.subjectId || null,
      type: eventData.type || 'exam',
      notes: eventData.notes ? sanitizeText(eventData.notes) : ''
    };

    set((state) => ({
      events: [...state.events, newEvent]
    }));
    get()._persist();
    return newEvent;
  },

  updateEvent: (eventId, updates) => {
    set((state) => ({
      events: state.events.map((evt) => {
        if (evt.id === eventId) {
          return {
            ...evt,
            ...updates,
            title: updates.title !== undefined ? (sanitizeText(updates.title) || evt.title) : evt.title,
            notes: updates.notes !== undefined ? sanitizeText(updates.notes) : evt.notes
          };
        }
        return evt;
      })
    }));
    get()._persist();
  },

  deleteEvent: (eventId) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId)
    }));
    get()._persist();
  },

  setAllData: (data) => {
    set({
      subjects: data.subjects || [],
      events: data.events || [],
      deletedItems: Array.isArray(data.deletedItems) ? data.deletedItems : [],
      deletionTombstones: data.deletionTombstones || get().deletionTombstones || { notes: [], subjects: [] }
    });
    get()._persist();
  },

  exportDataJSON: () => {
    const { subjects, events } = get();
    return JSON.stringify({ subjects, events, version: '2.0.0', exportedAt: new Date().toISOString() }, null, 2);
  },

  importDataJSON: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.subjects)) {
        set({
          subjects: parsed.subjects,
          events: Array.isArray(parsed.events) ? parsed.events : [],
          activeSubjectId: parsed.subjects[0]?.id || null,
          activeNoteId: parsed.subjects[0]?.notes[0]?.id || null
        });
        get()._persist();
        return { success: true };
      }
      return { success: false, error: 'Formato inválido: no contiene materias' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  deduplicateNotes: () => {
    let removedCount = 0;
    set((state) => ({
      subjects: state.subjects.map((sub) => {
        const seenTitles = new Set();
        const uniqueNotes = [];
        sub.notes.forEach((note) => {
          const key = (note.title || '').trim().toLowerCase();
          if (!seenTitles.has(key)) {
            seenTitles.add(key);
            uniqueNotes.push(note);
          } else {
            removedCount++;
          }
        });
        return { ...sub, notes: uniqueNotes };
      })
    }));
    get()._persist();
    return removedCount;
  },

  reloadFromDisk: () => {
    const diskData = storageService.loadFromDisk();
    if (diskData && Array.isArray(diskData.subjects)) {
      set({
        subjects: diskData.subjects,
        events: Array.isArray(diskData.events) ? diskData.events : [],
        deletedItems: Array.isArray(diskData.deletedItems) ? diskData.deletedItems : [],
        activeSubjectId: diskData.subjects[0]?.id || null,
        activeNoteId: diskData.subjects[0]?.notes[0]?.id || null
      });
      return { success: true, count: diskData.subjects.length };
    }
    return { success: false, error: 'No se encontraron datos en el disco local o la carpeta está vacía' };
  },

  syncToDisk: () => {
    const { subjects, events, deletedItems } = get();
    const rawSettings = localStorage.getItem('escribaSettings');
    const settings = rawSettings ? JSON.parse(rawSettings) : {};
    const success = storageService.saveToDisk({
      subjects,
      events,
      settings,
      deletedItems
    });
    return { success, path: storageService.getActivePath() };
  }
}));
