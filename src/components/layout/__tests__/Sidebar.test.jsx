import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('Sidebar Component', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [
        {
          id: 'sub-1',
          name: 'Arquitectura de Software',
          code: 'ARQ',
          color: '#3b82f6',
          archived: false,
          notes: [
            { id: 'note-1', title: 'Patrones de Diseño', content: 'Contenido', updatedAt: new Date().toISOString() }
          ]
        }
      ],
      activeSubjectId: 'sub-1',
      activeNoteId: null,
      activeView: 'dashboard',
      deletedItems: []
    });

    useUIStore.setState({
      sidebarOpen: true,
      sidebarCollapsed: false,
      searchQuery: '',
      sidebarView: 'subjects',
      activeModal: null
    });
  });

  it('renders mobile grabber handle with accessibility label', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText(/cerrar cajón de materias/i)).toBeInTheDocument();
  });

  it('renders search input for filtering notes or subjects', () => {
    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText(/buscar notas o materias/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Patrones' } });
    expect(useUIStore.getState().searchQuery).toBe('Patrones');
  });

  it('displays subjects and notes in the sidebar', () => {
    render(<Sidebar />);
    expect(screen.getByText('Arquitectura de Software')).toBeInTheDocument();
  });

  it('displays footer with Papelera button and archived subjects dropdown', () => {
    render(<Sidebar />);
    expect(screen.getByTitle(/papelera de reciclaje/i)).toBeInTheDocument();
    expect(screen.getByTitle(/ver materias archivadas/i)).toBeInTheDocument();
  });

  it('opens Trash modal when Papelera is clicked', () => {
    render(<Sidebar />);
    const trashBtn = screen.getByTitle(/papelera de reciclaje/i);
    fireEvent.click(trashBtn);

    expect(useUIStore.getState().activeModal).toBe('trash');
  });

  it('displays search snippet and sets searchHighlightTarget when clicking note in search', () => {
    useNotesStore.setState({
      subjects: [
        {
          id: 'sub-1',
          name: 'Algoritmos',
          color: '#3b82f6',
          notes: [
            {
              id: 'note-1',
              title: 'Grafos y Caminos',
              content: '<p>Vimos el algoritmo de Dijkstra para caminos mínimos en grafos.</p>'
            }
          ]
        }
      ]
    });
    useUIStore.setState({ searchQuery: 'Dijkstra' });

    render(<Sidebar />);

    expect(screen.getByText(/caminos mínimos/i)).toBeInTheDocument();

    const noteItem = screen.getByText(/Grafos y Caminos/i);
    fireEvent.click(noteItem);

    const target = useUIStore.getState().searchHighlightTarget;
    expect(target).not.toBe(null);
    expect(target.noteId).toBe('note-1');
    expect(target.query).toBe('dijkstra');
  });
});
