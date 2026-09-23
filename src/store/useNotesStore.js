import { create } from 'zustand';
import { storageService } from '../services/storageService.js';
import { generateId, sanitizeText, cleanNoteContent, getNoteDescendantIds } from '../utils/helpers.js';

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

  addSubject: ({ name, code = '', professor = '', color = '#3b82f6', icon = null, schedule = [] }) => {
    const nowIso = new Date().toISOString();
    const newSubject = {
      id: generateId('sub'),
      name: sanitizeText(name) || 'Nueva Materia',
      code: sanitizeText(code),
      professor: sanitizeText(professor),
      color,
      icon: icon || null,
      schedule,
      archived: false,
      notes: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      lastModified: nowIso
    };

    set((state) => {
      const subjects = [...state.subjects, newSubject];
      return { subjects, activeSubjectId: newSubject.id };
    });
    get()._persist();
    return newSubject;
  },

  updateSubject: (id, updates) => {
    const nowIso = new Date().toISOString();
    set((state) => ({
      subjects: state.subjects.map((sub) => {
        if (sub.id === id) {
          return {
            ...sub,
            ...updates,
            name: updates.name ? sanitizeText(updates.name) : sub.name,
            code: updates.code !== undefined ? sanitizeText(updates.code) : sub.code,
            professor: updates.professor !== undefined ? sanitizeText(updates.professor) : sub.professor,
            icon: updates.icon !== undefined ? updates.icon : (sub.icon || null),
            updatedAt: nowIso,
            lastModified: nowIso
          };
        }
        return sub;
      })
    }));
    get()._persist();
  },

  toggleArchiveSubject: (id) => {
    const nowIso = new Date().toISOString();
    set((state) => ({
      subjects: state.subjects.map((sub) => {
        if (sub.id === id) {
          return {
            ...sub,
            archived: !sub.archived,
            updatedAt: nowIso,
            lastModified: nowIso
          };
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
      parentId: initialData.parentId || null,
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

  addSubNote: (parentNoteId, initialData = {}) => {
    const state = get();
    let parentNote = null;
    let targetSubjectId = null;

    for (const sub of state.subjects) {
      const found = (sub.notes || []).find((n) => n.id === parentNoteId);
      if (found) {
        parentNote = found;
        targetSubjectId = sub.id;
        break;
      }
    }

    if (!parentNote || !targetSubjectId) {
      return get().addNote(state.activeSubjectId, initialData);
    }

    const nowIso = new Date().toISOString();
    const newSubNote = {
      id: generateId('note'),
      title: sanitizeText(initialData.title) || 'Sub-apunte sin título',
      content: initialData.content ? cleanNoteContent(initialData.content) : '<p></p>',
      subjectId: targetSubjectId,
      parentId: parentNoteId,
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
            const parentIndex = sub.notes.findIndex((n) => n.id === parentNoteId);
            const updatedNotes = [...sub.notes];
            if (parentIndex !== -1) {
              updatedNotes.splice(parentIndex + 1, 0, newSubNote);
            } else {
              updatedNotes.unshift(newSubNote);
            }
            return {
              ...sub,
              lastModified: nowIso,
              notes: updatedNotes
            };
          }
          return sub;
        }),
        deletionTombstones: {
          notes: (prevTombstones.notes || []).filter((nId) => nId !== newSubNote.id),
          subjects: prevTombstones.subjects || []
        },
        activeSubjectId: targetSubjectId,
        activeNoteId: newSubNote.id,
        activeView: 'editor'
      };
    });
    get()._persist();
    return newSubNote;
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
    let subjectContainingNote = null;

    for (const sub of state.subjects) {
      const found = (sub.notes || []).find((n) => n.id === noteId);
      if (found) {
        noteToDelete = found;
        parentSubjectId = sub.id;
        subjectContainingNote = sub;
        break;
      }
    }

    if (!noteToDelete || !subjectContainingNote) return;

    const descendantIds = getNoteDescendantIds(subjectContainingNote.notes, noteId);
    const allIdsToDelete = [noteId, ...descendantIds];
    const notesToDelete = subjectContainingNote.notes.filter((n) => allIdsToDelete.includes(n.id));

    const nowIso = new Date().toISOString();
    const newDeletedItems = notesToDelete.map((item) => ({
      id: generateId('del'),
      type: 'note',
      item,
      subjectId: parentSubjectId,
      deletedAt: nowIso
    }));

    const newSubjects = state.subjects.map((sub) => {
      if (sub.id === parentSubjectId) {
        return {
          ...sub,
          lastModified: nowIso,
          notes: sub.notes.filter((n) => !allIdsToDelete.includes(n.id))
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
      notes: [...new Set([...(prevTombstones.notes || []), ...allIdsToDelete])],
      subjects: prevTombstones.subjects || []
    };

    set({
      subjects: newSubjects,
      deletedItems: [...currentDeleted, ...newDeletedItems],
      deletionTombstones: updatedTombstones,
      activeNoteId: allIdsToDelete.includes(state.activeNoteId) ? nextNoteId : state.activeNoteId,
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
    let currentSub = null;
    let targetNote = null;

    for (const sub of state.subjects) {
      const found = (sub.notes || []).find((n) => n.id === noteId);
      if (found) {
        currentSub = sub;
        targetNote = found;
        break;
      }
    }

    if (!targetNote || !currentSub) return;
    if (currentSub.id === targetSubjectId) return;

    const descendantIds = getNoteDescendantIds(currentSub.notes, noteId);
    const allIdsToMove = [noteId, ...descendantIds];

    const notesToMove = currentSub.notes
      .filter((n) => allIdsToMove.includes(n.id))
      .map((n) => ({
        ...n,
        subjectId: targetSubjectId,
        parentId: n.id === noteId ? null : n.parentId
      }));

    const nowIso = new Date().toISOString();

    set((state) => ({
      subjects: state.subjects.map((sub) => {
        if (sub.id === targetSubjectId) {
          return {
            ...sub,
            lastModified: nowIso,
            notes: [...notesToMove, ...sub.notes]
          };
        }
        if (sub.id === currentSub.id) {
          return {
            ...sub,
            lastModified: nowIso,
            notes: sub.notes.filter((n) => !allIdsToMove.includes(n.id))
          };
        }
        return sub;
      }),
      activeSubjectId: targetSubjectId
    }));
    get()._persist();
  },

  moveNoteToParent: (noteId, newParentId = null) => {
    if (noteId === newParentId) return false;
    const state = get();

    let targetSub = null;
    let targetNote = null;
    for (const sub of state.subjects) {
      const found = (sub.notes || []).find((n) => n.id === noteId);
      if (found) {
        targetSub = sub;
        targetNote = found;
        break;
      }
    }

    if (!targetNote || !targetSub) return false;

    if (newParentId) {
      const descendants = getNoteDescendantIds(targetSub.notes, noteId);
      if (descendants.includes(newParentId)) {
        return false;
      }
      const parentExists = targetSub.notes.some((n) => n.id === newParentId);
      if (!parentExists) return false;
    }

    const nowIso = new Date().toISOString();
    set((state) => ({
      subjects: state.subjects.map((sub) => {
        if (sub.id === targetSub.id) {
          return {
            ...sub,
            lastModified: nowIso,
            notes: sub.notes.map((n) => {
              if (n.id === noteId) {
                return {
                  ...n,
                  parentId: newParentId || null,
                  updatedAt: nowIso
                };
              }
              return n;
            })
          };
        }
        return sub;
      })
    }));
    get()._persist();
    return true;
  },

  duplicateNote: (noteId) => {
    const state = get();
    for (const sub of state.subjects) {
      const note = (sub.notes || []).find((n) => n.id === noteId);
      if (note) {
        const nowIso = new Date().toISOString();
        const descendantIds = getNoteDescendantIds(sub.notes, noteId);

        if (descendantIds.length === 0) {
          const copy = {
            ...note,
            id: generateId('note'),
            title: `${note.title} (Copia)`,
            createdAt: nowIso,
            updatedAt: nowIso
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

        const idMap = new Map();
        const newRootId = generateId('note');
        idMap.set(noteId, newRootId);

        const copyRoot = {
          ...note,
          id: newRootId,
          title: `${note.title} (Copia)`,
          createdAt: nowIso,
          updatedAt: nowIso
        };

        const descendantNotes = sub.notes.filter((n) => descendantIds.includes(n.id));
        const copies = [copyRoot];

        descendantNotes.forEach((desc) => {
          const newChildId = generateId('note');
          idMap.set(desc.id, newChildId);
          copies.push({
            ...desc,
            id: newChildId,
            parentId: idMap.get(desc.parentId) || newRootId,
            createdAt: nowIso,
            updatedAt: nowIso
          });
        });

        set((state) => ({
          subjects: state.subjects.map((s) => {
            if (s.id === sub.id) {
              return { ...s, notes: [...copies, ...s.notes] };
            }
            return s;
          }),
          activeNoteId: copyRoot.id
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
      const restoredNote = { ...itemToRestore.item };
      const restoredNoteId = restoredNote?.id;

      if (restoredNote && restoredNote.parentId) {
        const sub = state.subjects.find((s) => s.id === targetSubId);
        const parentExists = sub && (sub.notes || []).some((n) => n.id === restoredNote.parentId);
        if (!parentExists) {
          restoredNote.parentId = null;
        }
      }

      set({
        subjects: targetSubExists
          ? state.subjects.map((sub) =>
            sub.id === targetSubId ? { ...sub, notes: [restoredNote, ...sub.notes] } : sub
          )
          : [
            ...state.subjects,
            {
              id: targetSubId || generateId('sub'),
              name: 'Materia Restaurada',
              color: '#3b82f6',
              schedule: [],
              notes: [restoredNote]
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
