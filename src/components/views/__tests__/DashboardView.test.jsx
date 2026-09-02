import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardView } from '../DashboardView.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('DashboardView Component', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [
        {
          id: 'sub-1',
          name: 'Inteligencia Artificial',
          code: 'IA',
          color: '#8b5cf6',
          archived: false,
          schedule: [],
          notes: [
            {
              id: 'note-1',
              title: 'Redes Neuronales',
              content: 'Capas densas y backprop',
              updatedAt: new Date().toISOString(),
              favorite: true
            }
          ]
        }
      ],
      events: [],
      activeSubjectId: 'sub-1',
      activeNoteId: null,
      activeView: 'dashboard'
    });

    useUIStore.setState({
      activeModal: null
    });
  });

  it('renders greeting heading and recent notes', () => {
    render(<DashboardView />);
    expect(screen.getByText(/¡buenas/i)).toBeInTheDocument();
    expect(screen.getByText('Redes Neuronales')).toBeInTheDocument();
  });

  it('clicking a recent note navigates to NoteEditor', () => {
    render(<DashboardView />);
    const noteCard = screen.getByText('Redes Neuronales').closest('div');
    fireEvent.click(noteCard);

    expect(useNotesStore.getState().activeView).toBe('editor');
    expect(useNotesStore.getState().activeNoteId).toBe('note-1');
  });

  it('renders quick action buttons and modal triggers', () => {
    render(<DashboardView />);
    const addExamBtn = screen.getByTitle(/agregar examen/i);
    expect(addExamBtn).toBeInTheDocument();

    fireEvent.click(addExamBtn);
    expect(useUIStore.getState().activeModal).toBe('event');
  });
});
