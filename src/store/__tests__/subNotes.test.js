import { describe, it, expect, beforeEach } from 'vitest';
import { useNotesStore } from '../useNotesStore.js';
import { buildNoteTree, getNoteAncestors, getNoteDescendantIds } from '../../utils/helpers.js';

describe('Sub-notes (Hierarchical Notes)', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [],
      events: [],
      deletedItems: [],
      deletionTombstones: { notes: [], subjects: [] },
      activeSubjectId: null,
      activeNoteId: null,
      activeView: 'dashboard'
    });
  });

  describe('Tree and Ancestor Helpers', () => {
    const sampleNotes = [
      { id: 'n1', title: 'Root 1', parentId: null },
      { id: 'n2', title: 'Sub 1.1', parentId: 'n1' },
      { id: 'n3', title: 'Sub 1.1.1', parentId: 'n2' },
      { id: 'n4', title: 'Sub 1.2', parentId: 'n1' },
      { id: 'n5', title: 'Root 2', parentId: null },
      { id: 'n6', title: 'Orphan with invalid parent', parentId: 'non-existent' }
    ];

    it('buildNoteTree properly nests children and handles missing parents gracefully', () => {
      const tree = buildNoteTree(sampleNotes);

      expect(tree.length).toBe(3);
      expect(tree[0].id).toBe('n1');
      expect(tree[1].id).toBe('n5');
      expect(tree[2].id).toBe('n6');

      expect(tree[0].children.length).toBe(2);
      expect(tree[0].children[0].id).toBe('n2');
      expect(tree[0].children[1].id).toBe('n4');

      expect(tree[0].children[0].children.length).toBe(1);
      expect(tree[0].children[0].children[0].id).toBe('n3');
    });

    it('getNoteAncestors returns ordered ancestors from root to immediate parent', () => {
      const ancestorsOfN3 = getNoteAncestors(sampleNotes, 'n3');
      expect(ancestorsOfN3.map((n) => n.id)).toEqual(['n1', 'n2']);

      const ancestorsOfN2 = getNoteAncestors(sampleNotes, 'n2');
      expect(ancestorsOfN2.map((n) => n.id)).toEqual(['n1']);

      const ancestorsOfRoot = getNoteAncestors(sampleNotes, 'n1');
      expect(ancestorsOfRoot).toEqual([]);
    });

    it('getNoteDescendantIds returns all nested descendant IDs', () => {
      const descendantsOfN1 = getNoteDescendantIds(sampleNotes, 'n1');
      expect(descendantsOfN1).toContain('n2');
      expect(descendantsOfN1).toContain('n3');
      expect(descendantsOfN1).toContain('n4');
      expect(descendantsOfN1.length).toBe(3);

      const descendantsOfN2 = getNoteDescendantIds(sampleNotes, 'n2');
      expect(descendantsOfN2).toEqual(['n3']);

      const descendantsOfN3 = getNoteDescendantIds(sampleNotes, 'n3');
      expect(descendantsOfN3).toEqual([]);
    });
  });

  describe('Store Actions for Sub-notes', () => {
    it('creates a sub-note linked to a parent note with addSubNote', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Biología' });
      const parentNote = useNotesStore.getState().addNote(sub.id, { title: 'Células' });

      const subNote = useNotesStore.getState().addSubNote(parentNote.id, { title: 'Mitocondria' });

      expect(subNote).toBeDefined();
      expect(subNote.parentId).toBe(parentNote.id);
      expect(subNote.subjectId).toBe(sub.id);
      expect(subNote.title).toBe('Mitocondria');

      const updatedSub = useNotesStore.getState().subjects.find((s) => s.id === sub.id);
      expect(updatedSub.notes.length).toBe(2);
      expect(useNotesStore.getState().activeNoteId).toBe(subNote.id);
    });

    it('deletes a parent note and all of its descendants in cascade (Option A)', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Historia' });
      const rootNote = useNotesStore.getState().addNote(sub.id, { title: 'Revolución' });
      const child1 = useNotesStore.getState().addSubNote(rootNote.id, { title: 'Causas' });
      const child2 = useNotesStore.getState().addSubNote(rootNote.id, { title: 'Consecuencias' });
      const grandChild = useNotesStore.getState().addSubNote(child1.id, { title: 'Economía' });
      const otherRoot = useNotesStore.getState().addNote(sub.id, { title: 'Otra era' });

      let currentNotes = useNotesStore.getState().subjects.find((s) => s.id === sub.id).notes;
      expect(currentNotes.length).toBe(5);

      useNotesStore.getState().deleteNote(rootNote.id);

      const updatedNotes = useNotesStore.getState().subjects.find((s) => s.id === sub.id).notes;
      expect(updatedNotes.length).toBe(1);
      expect(updatedNotes[0].id).toBe(otherRoot.id);

      const deleted = useNotesStore.getState().deletedItems;
      const deletedNoteIds = deleted.map((d) => d.item.id);
      expect(deletedNoteIds).toContain(rootNote.id);
      expect(deletedNoteIds).toContain(child1.id);
      expect(deletedNoteIds).toContain(child2.id);
      expect(deletedNoteIds).toContain(grandChild.id);

      const tombstones = useNotesStore.getState().deletionTombstones.notes;
      expect(tombstones).toContain(rootNote.id);
      expect(tombstones).toContain(child1.id);
      expect(tombstones).toContain(child2.id);
      expect(tombstones).toContain(grandChild.id);
    });

    it('duplicates note tree recursively with remapped parentIds', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Química' });
      const parent = useNotesStore.getState().addNote(sub.id, { title: 'Átomos' });
      const child = useNotesStore.getState().addSubNote(parent.id, { title: 'Electrones' });

      useNotesStore.getState().duplicateNote(parent.id);

      const notesInSub = useNotesStore.getState().subjects.find((s) => s.id === sub.id).notes;
      expect(notesInSub.length).toBe(4);

      const copiedParent = notesInSub.find((n) => n.title.includes('Átomos (Copia)'));
      expect(copiedParent).toBeDefined();

      const copiedChild = notesInSub.find((n) => n.parentId === copiedParent.id);
      expect(copiedChild).toBeDefined();
      expect(copiedChild.title).toBe('Electrones');
    });

    it('moves note to a new parent or unparents, preventing cycles', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Programación' });
      const noteA = useNotesStore.getState().addNote(sub.id, { title: 'A' });
      const noteB = useNotesStore.getState().addNote(sub.id, { title: 'B' });
      const noteC = useNotesStore.getState().addSubNote(noteB.id, { title: 'C' });

      const moveOk1 = useNotesStore.getState().moveNoteToParent(noteB.id, noteA.id);
      expect(moveOk1).toBe(true);

      let currentNotes = useNotesStore.getState().subjects.find((s) => s.id === sub.id).notes;
      expect(currentNotes.find((n) => n.id === noteB.id).parentId).toBe(noteA.id);

      const moveCycle = useNotesStore.getState().moveNoteToParent(noteA.id, noteC.id);
      expect(moveCycle).toBe(false);

      const moveSelf = useNotesStore.getState().moveNoteToParent(noteA.id, noteA.id);
      expect(moveSelf).toBe(false);

      const unparentOk = useNotesStore.getState().moveNoteToParent(noteB.id, null);
      expect(unparentOk).toBe(true);
      currentNotes = useNotesStore.getState().subjects.find((s) => s.id === sub.id).notes;
      expect(currentNotes.find((n) => n.id === noteB.id).parentId).toBeNull();
    });

    it('moves note and all its sub-notes when moving to another subject', () => {
      const sub1 = useNotesStore.getState().addSubject({ name: 'Materia 1' });
      const sub2 = useNotesStore.getState().addSubject({ name: 'Materia 2' });

      const parent = useNotesStore.getState().addNote(sub1.id, { title: 'Tema Principal' });
      const child = useNotesStore.getState().addSubNote(parent.id, { title: 'Sub-tema' });

      useNotesStore.getState().moveNote(parent.id, sub2.id);

      const notesInSub1 = useNotesStore.getState().subjects.find((s) => s.id === sub1.id).notes;
      const notesInSub2 = useNotesStore.getState().subjects.find((s) => s.id === sub2.id).notes;

      expect(notesInSub1.length).toBe(0);
      expect(notesInSub2.length).toBe(2);

      const movedParent = notesInSub2.find((n) => n.id === parent.id);
      const movedChild = notesInSub2.find((n) => n.id === child.id);

      expect(movedParent.subjectId).toBe(sub2.id);
      expect(movedChild.subjectId).toBe(sub2.id);
      expect(movedChild.parentId).toBe(parent.id);
    });

    it('unparents a restored note if its parent no longer exists', () => {
      const sub = useNotesStore.getState().addSubject({ name: 'Filosofía' });
      const parent = useNotesStore.getState().addNote(sub.id, { title: 'Grecia' });
      const child = useNotesStore.getState().addSubNote(parent.id, { title: 'Platón' });

      useNotesStore.getState().deleteNote(parent.id);

      const deletedChild = useNotesStore.getState().deletedItems.find((d) => d.item.id === child.id);
      expect(deletedChild).toBeDefined();

      useNotesStore.getState().restoreItem(deletedChild.id);

      const restoredChild = useNotesStore.getState().subjects.find((s) => s.id === sub.id).notes.find((n) => n.id === child.id);
      expect(restoredChild).toBeDefined();
      expect(restoredChild.parentId).toBeNull();
    });

    describe('reorderOrMoveNote (Drag and Drop)', () => {
      it('reorders notes with position = before and position = after', () => {
        const sub = useNotesStore.getState().addSubject({ name: 'Matemática' });
        const n1 = useNotesStore.getState().addNote(sub.id, { title: 'Nota 1' });
        const n2 = useNotesStore.getState().addNote(sub.id, { title: 'Nota 2' });
        const n3 = useNotesStore.getState().addNote(sub.id, { title: 'Nota 3' });

        const res1 = useNotesStore.getState().reorderOrMoveNote({
          noteId: n1.id,
          targetSubjectId: sub.id,
          targetNoteId: n3.id,
          position: 'before'
        });
        expect(res1).toBe(true);

        let notes = useNotesStore.getState().subjects.find((s) => s.id === sub.id).notes;
        expect(notes.map((n) => n.id)).toEqual([n1.id, n3.id, n2.id]);

        const res2 = useNotesStore.getState().reorderOrMoveNote({
          noteId: n1.id,
          targetSubjectId: sub.id,
          targetNoteId: n2.id,
          position: 'after'
        });
        expect(res2).toBe(true);

        notes = useNotesStore.getState().subjects.find((s) => s.id === sub.id).notes;
        expect(notes.map((n) => n.id)).toEqual([n3.id, n2.id, n1.id]);
      });

      it('nests a note inside another note (position = inside)', () => {
        const sub = useNotesStore.getState().addSubject({ name: 'Física' });
        const parent = useNotesStore.getState().addNote(sub.id, { title: 'Mecánica' });
        const child = useNotesStore.getState().addNote(sub.id, { title: 'Cinemática' });

        const res = useNotesStore.getState().reorderOrMoveNote({
          noteId: child.id,
          targetSubjectId: sub.id,
          targetNoteId: parent.id,
          position: 'inside'
        });
        expect(res).toBe(true);

        const notes = useNotesStore.getState().subjects.find((s) => s.id === sub.id).notes;
        const movedChild = notes.find((n) => n.id === child.id);
        expect(movedChild.parentId).toBe(parent.id);
      });

      it('prevents cyclic nesting when dragging a parent inside its descendant', () => {
        const sub = useNotesStore.getState().addSubject({ name: 'Biología' });
        const grandpa = useNotesStore.getState().addNote(sub.id, { title: 'Célula' });
        const parent = useNotesStore.getState().addSubNote(grandpa.id, { title: 'Núcleo' });
        const child = useNotesStore.getState().addSubNote(parent.id, { title: 'ADN' });

        const res = useNotesStore.getState().reorderOrMoveNote({
          noteId: grandpa.id,
          targetSubjectId: sub.id,
          targetNoteId: child.id,
          position: 'inside'
        });
        expect(res).toBe(false);

        const res2 = useNotesStore.getState().reorderOrMoveNote({
          noteId: grandpa.id,
          targetSubjectId: sub.id,
          targetNoteId: child.id,
          position: 'before'
        });
        expect(res2).toBe(false);
      });

      it('moves a note and its descendants to another subject and nests under a target note', () => {
        const sub1 = useNotesStore.getState().addSubject({ name: 'Origen' });
        const sub2 = useNotesStore.getState().addSubject({ name: 'Destino' });

        const root1 = useNotesStore.getState().addNote(sub1.id, { title: 'Tema A' });
        const child1 = useNotesStore.getState().addSubNote(root1.id, { title: 'Sub-tema A1' });

        const targetInSub2 = useNotesStore.getState().addNote(sub2.id, { title: 'Tema B' });

        const res = useNotesStore.getState().reorderOrMoveNote({
          noteId: root1.id,
          targetSubjectId: sub2.id,
          targetNoteId: targetInSub2.id,
          position: 'inside'
        });
        expect(res).toBe(true);

        const notes1 = useNotesStore.getState().subjects.find((s) => s.id === sub1.id).notes;
        const notes2 = useNotesStore.getState().subjects.find((s) => s.id === sub2.id).notes;

        expect(notes1.length).toBe(0);
        expect(notes2.length).toBe(3);

        const movedRoot = notes2.find((n) => n.id === root1.id);
        const movedChild = notes2.find((n) => n.id === child1.id);

        expect(movedRoot.subjectId).toBe(sub2.id);
        expect(movedRoot.parentId).toBe(targetInSub2.id);
        expect(movedChild.subjectId).toBe(sub2.id);
        expect(movedChild.parentId).toBe(root1.id);
      });
    });
  });
});
