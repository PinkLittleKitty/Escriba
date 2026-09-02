import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteEditor } from '../NoteEditor.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('NoteEditor Component', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [
        {
          id: 'sub-1',
          name: 'Inteligencia Artificial',
          color: '#3b82f6',
          notes: [
            {
              id: 'note-1',
              title: 'Redes Convolucionales',
              content: '<p>Filtros y pooling</p>',
              favorite: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'note-2',
              title: 'Visión por Computadora',
              content: '<p>Ver apunte sobre Redes Convolucionales para detalles</p>',
              favorite: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ],
      activeSubjectId: 'sub-1',
      activeNoteId: 'note-1',
      activeView: 'editor'
    });

    useUIStore.setState({
      activeModal: null,
      toasts: []
    });
  });

  it('renders empty message when no note is selected', () => {
    useNotesStore.setState({ activeNoteId: null });
    render(<NoteEditor />);
    expect(screen.getByText(/no hay ningún apunte seleccionado/i)).toBeInTheDocument();
  });

  it('renders active note title and subject breadcrumb', () => {
    render(<NoteEditor />);
    expect(screen.getByDisplayValue('Redes Convolucionales')).toBeInTheDocument();
    expect(screen.getByText('Inteligencia Artificial')).toBeInTheDocument();
  });

  it('updates title in store when typing in title input', () => {
    vi.useFakeTimers();
    render(<NoteEditor />);
    const titleInput = screen.getByDisplayValue('Redes Convolucionales');

    act(() => {
      fireEvent.change(titleInput, { target: { value: 'CNNs y Visión' } });
      vi.advanceTimersByTime(500);
    });

    const updatedNote = useNotesStore.getState().subjects[0].notes[0];
    expect(updatedNote.title).toBe('CNNs y Visión');
    vi.useRealTimers();
  });

  it('toggles favorite status when clicking star button', () => {
    render(<NoteEditor />);
    const starBtn = screen.getByTitle(/marcar como favorito/i);
    fireEvent.click(starBtn);

    let updatedNote = useNotesStore.getState().subjects[0].notes[0];
    expect(updatedNote.favorite).toBe(true);

    fireEvent.click(starBtn);
    updatedNote = useNotesStore.getState().subjects[0].notes[0];
    expect(updatedNote.favorite).toBe(false);
  });

  it('opens export modal when clicking share button', () => {
    render(<NoteEditor />);
    const shareBtn = screen.getByTitle(/compartir apunte/i);
    fireEvent.click(shareBtn);

    expect(useUIStore.getState().activeModal).toBe('export');
  });

  it('displays backlinks when another note references current note', () => {
    render(<NoteEditor />);
    expect(screen.getByText(/menciones a este apunte/i)).toBeInTheDocument();
    expect(screen.getByText(/visión por computadora/i)).toBeInTheDocument();
  });
});
