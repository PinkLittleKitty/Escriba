import { describe, it, expect, beforeEach } from 'vitest';
import { useNotesStore } from '../useNotesStore.js';

describe('useNotesStore', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [],
      events: [],
      deletedItems: [],
      activeSubjectId: null,
      activeNoteId: null,
      activeView: 'welcome'
    });
  });

  describe('Subject management', () => {
    it('adds a subject', () => {
      const subject = useNotesStore.getState().addSubject({
        name: 'Matemática',
        code: 'MATE',
        professor: 'Alan Turing',
        color: '#ff0055'
      });

      expect(subject.id).toBeDefined();
      expect(subject.name).toBe('Matemática');
      expect(subject.code).toBe('MATE');
      expect(subject.color).toBe('#ff0055');
      expect(subject.notes).toEqual([]);
      expect(subject.archived).toBe(false);

      const state = useNotesStore.getState();
      expect(state.subjects.length).toBe(1);
      expect(state.activeSubjectId).toBe(subject.id);
    });

    it('updates subject details', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Física' });
      useNotesStore.getState().updateSubject(sub.id, { name: 'Física Cuántica', color: '#10b981' });

      const updated = useNotesStore.getState().subjects.find((s) => s.id === sub.id);
      expect(updated.name).toBe('Física Cuántica');
      expect(updated.color).toBe('#10b981');
    });

    it('archives and unarchives subject', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Química' });
      useNotesStore.getState().toggleArchiveSubject(sub.id);

      let current = useNotesStore.getState().subjects.find((s) => s.id === sub.id);
      expect(current.archived).toBe(true);

      useNotesStore.getState().toggleArchiveSubject(sub.id);
      current = useNotesStore.getState().subjects.find((s) => s.id === sub.id);
      expect(current.archived).toBe(false);
    });

    it('deletes a subject and moves it to deletedItems', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Historia' });
      useNotesStore.getState().deleteSubject(sub.id);

      const state = useNotesStore.getState();
      expect(state.subjects.length).toBe(0);
      expect(state.deletedItems.length).toBe(1);
      expect(state.deletedItems[0].type).toBe('subject');
      expect(state.deletedItems[0].item.id).toBe(sub.id);
    });
  });

  describe('Note management', () => {
    it('adds a note to an existing subject', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Programación' });
      const note = useNotesStore.getState().addNote(sub.id, {
        title: 'Algoritmos y Estructuras',
        content: '<p>Contenido inicial</p>'
      });

      expect(note).toBeDefined();
      expect(note.title).toBe('Algoritmos y Estructuras');
      expect(note.favorite).toBe(false);

      const subInState = useNotesStore.getState().subjects.find((s) => s.id === sub.id);
      expect(subInState.notes.length).toBe(1);
      expect(subInState.notes[0].id).toBe(note.id);
    });

    it('updates note content and title', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Redes' });
      const note = useNotesStore.getState().addNote(sub.id, { title: 'Modelo OSI' });

      useNotesStore.getState().updateNote(note.id, {
        title: 'Modelo TCP/IP',
        content: 'Nueva capa de red'
      });

      const updatedNote = useNotesStore.getState().subjects
        .find((s) => s.id === sub.id)
        .notes.find((n) => n.id === note.id);

      expect(updatedNote.title).toBe('Modelo TCP/IP');
      expect(updatedNote.content).toBe('Nueva capa de red');
    });

    it('toggles favorite on note', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Sistemas Operativos' });
      const note = useNotesStore.getState().addNote(sub.id, { title: 'Procesos e Hilos' });

      useNotesStore.getState().toggleFavorite(note.id);
      let updatedNote = useNotesStore.getState().subjects[0].notes[0];
      expect(updatedNote.favorite).toBe(true);

      useNotesStore.getState().toggleFavorite(note.id);
      updatedNote = useNotesStore.getState().subjects[0].notes[0];
      expect(updatedNote.favorite).toBe(false);
    });

    it('duplicates a note within subject', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Base de Datos' });
      const note = useNotesStore.getState().addNote(sub.id, { title: 'SQL Joins' });

      useNotesStore.getState().duplicateNote(note.id);

      const subInState = useNotesStore.getState().subjects[0];
      expect(subInState.notes.length).toBe(2);
      expect(subInState.notes[0].title).toBe('SQL Joins (Copia)');
    });

    it('deletes note and moves it to deletedItems', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Objetos 2' });
      const note = useNotesStore.getState().addNote(sub.id, { title: 'Diagramas UML' });

      useNotesStore.getState().deleteNote(note.id);

      const subInState = useNotesStore.getState().subjects[0];
      expect(subInState.notes.length).toBe(0);

      const deleted = useNotesStore.getState().deletedItems;
      expect(deleted.length).toBe(1);
      expect(deleted[0].type).toBe('note');
      expect(deleted[0].item.title).toBe('Diagramas UML');
    });
  });

  describe('Trash and Restoration', () => {
    it('restores deleted subject from trash', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Economía' });
      useNotesStore.getState().deleteSubject(sub.id);

      const delItem = useNotesStore.getState().deletedItems[0];
      useNotesStore.getState().restoreItem(delItem.id);

      expect(useNotesStore.getState().deletedItems.length).toBe(0);
      expect(useNotesStore.getState().subjects.length).toBe(1);
      expect(useNotesStore.getState().subjects[0].name).toBe('Economía');
    });

    it('empties trash permanently', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Arquitectura' });
      useNotesStore.getState().deleteSubject(sub.id);
      expect(useNotesStore.getState().deletedItems.length).toBe(1);

      useNotesStore.getState().emptyTrash();
      expect(useNotesStore.getState().deletedItems.length).toBe(0);
    });
  });

  describe('View & Active item navigation', () => {
    it('changes active view', () => {
      useNotesStore.getState().setActiveView('calendar');
      expect(useNotesStore.getState().activeView).toBe('calendar');

      useNotesStore.getState().setActiveView('dashboard');
      expect(useNotesStore.getState().activeView).toBe('dashboard');
    });

    it('sets active note and switches to editor view', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Algebra' });
      const note = useNotesStore.getState().addNote(sub.id, { title: 'Matrices' });

      useNotesStore.getState().setActiveNote(sub.id, note.id);
      const state = useNotesStore.getState();
      expect(state.activeSubjectId).toBe(sub.id);
      expect(state.activeNoteId).toBe(note.id);
      expect(state.activeView).toBe('editor');
    });
  });
});
