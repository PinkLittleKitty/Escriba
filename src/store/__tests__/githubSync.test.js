import { describe, it, expect, beforeEach } from 'vitest';
import { gitHubService } from '../../services/githubService.js';
import { useNotesStore } from '../useNotesStore.js';

describe('GitHub Sync and Deletion Logic', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [],
      events: [],
      deletedItems: [],
      deletionTombstones: { notes: [], subjects: [] },
      activeSubjectId: null,
      activeNoteId: null,
      activeView: 'welcome'
    });
    localStorage.clear();
  });

  describe('gitHubService.mergeData', () => {
    it('filters out notes deleted locally when remote has the note', () => {
      const local = {
        subjects: [
          {
            id: 'sub-1',
            name: 'Matemática',
            notes: []
          }
        ],
        deletedItems: { notes: ['note-test-1'], subjects: [] }
      };

      const remote = {
        subjects: [
          {
            id: 'sub-1',
            name: 'Matemática',
            notes: [
              {
                id: 'note-test-1',
                title: 'Nota de prueba',
                content: '<p>Test</p>'
              }
            ]
          }
        ],
        deletedItems: { notes: [], subjects: [] }
      };

      const merged = gitHubService.mergeData(local, remote);
      expect(merged.subjects.length).toBe(1);
      expect(merged.subjects[0].notes.length).toBe(0);
      expect(merged.deletedItems.notes).toContain('note-test-1');
    });

    it('handles deletedItems when provided as array or object in local and remote', () => {
      const local = {
        subjects: [{ id: 'sub-1', notes: [] }],
        deletedItems: [
          { id: 'del-1', type: 'note', item: { id: 'note-1' } }
        ]
      };

      const remote = {
        subjects: [{ id: 'sub-1', notes: [{ id: 'note-1', title: 'Old Note' }] }],
        deletedItems: { notes: [], subjects: [] }
      };

      const merged = gitHubService.mergeData(local, remote);
      expect(merged.subjects[0].notes.length).toBe(0);
      expect(merged.deletedItems.notes).toContain('note-1');
    });

    it('filters deleted notes even on remote subjects that do not exist locally', () => {
      const local = {
        subjects: [],
        deletedItems: { notes: ['note-orphan-1'], subjects: [] }
      };

      const remote = {
        subjects: [
          {
            id: 'sub-remote-only',
            name: 'Física',
            notes: [
              { id: 'note-orphan-1', title: 'Orphan Note' },
              { id: 'note-keep', title: 'Keep Note' }
            ]
          }
        ],
        deletedItems: { notes: [], subjects: [] }
      };

      const merged = gitHubService.mergeData(local, remote);
      expect(merged.subjects.length).toBe(1);
      expect(merged.subjects[0].notes.length).toBe(1);
      expect(merged.subjects[0].notes[0].id).toBe('note-keep');
    });
  });

  describe('useNotesStore deletion tombstones', () => {
    it('retains deletion tombstones even after trash is emptied', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Química' });
      const note = useNotesStore.getState().addNote(sub.id, { title: 'Tabla Periódica' });

      expect(useNotesStore.getState().subjects[0].notes.length).toBe(1);

      useNotesStore.getState().deleteNote(note.id);
      expect(useNotesStore.getState().subjects[0].notes.length).toBe(0);
      expect(useNotesStore.getState().deletedItems.length).toBe(1);
      expect(useNotesStore.getState().deletionTombstones.notes).toContain(note.id);

      useNotesStore.getState().emptyTrash();
      expect(useNotesStore.getState().deletedItems.length).toBe(0);
      expect(useNotesStore.getState().deletionTombstones.notes).toContain(note.id);
    });

    it('removes tombstone when item is restored', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Historia' });
      const note = useNotesStore.getState().addNote(sub.id, { title: 'Revolución' });

      useNotesStore.getState().deleteNote(note.id);
      expect(useNotesStore.getState().deletionTombstones.notes).toContain(note.id);

      const delItem = useNotesStore.getState().deletedItems[0];
      useNotesStore.getState().restoreItem(delItem.id);

      expect(useNotesStore.getState().deletionTombstones.notes).not.toContain(note.id);
      expect(useNotesStore.getState().subjects[0].notes.length).toBe(1);
    });
  });
});
