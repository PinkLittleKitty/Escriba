import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrashModal } from '../TrashModal.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('TrashModal Component', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [],
      deletedItems: []
    });
    useUIStore.setState({
      activeModal: 'trash',
      toasts: []
    });
    window.confirm = vi.fn(() => true);
  });

  it('shows empty message when trash is empty', () => {
    render(<TrashModal />);
    expect(screen.getByText(/la papelera está vacía/i)).toBeInTheDocument();
  });

  it('renders deleted items and allows restoration', () => {
    useNotesStore.setState({
      deletedItems: [
        {
          id: 'del-1',
          type: 'note',
          item: { id: 'note-1', title: 'Apunte Borrado', content: '' },
          deletedAt: new Date().toISOString()
        }
      ]
    });

    render(<TrashModal />);
    expect(screen.getByText(/apunte: apunte borrado/i)).toBeInTheDocument();

    const restoreBtn = screen.getByRole('button', { name: /restaurar/i });
    fireEvent.click(restoreBtn);

    expect(useNotesStore.getState().deletedItems.length).toBe(0);
  });

  it('empties trash when clicking vaciar papelera', () => {
    useNotesStore.setState({
      deletedItems: [
        {
          id: 'del-2',
          type: 'subject',
          item: { id: 'sub-2', name: 'Materia Borrada', notes: [] },
          deletedAt: new Date().toISOString()
        }
      ]
    });

    render(<TrashModal />);
    const emptyBtn = screen.getByRole('button', { name: /vaciar papelera/i });
    fireEvent.click(emptyBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(useNotesStore.getState().deletedItems.length).toBe(0);
    expect(useUIStore.getState().activeModal).toBe(null);
  });
});
