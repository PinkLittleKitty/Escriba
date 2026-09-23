import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteEditor } from '../NoteEditor.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('NoteEditor Zoom Feature (Word-like Zoom)', () => {
  beforeEach(() => {
    localStorage.clear();
    useNotesStore.setState({
      subjects: [
        {
          id: 'sub-zoom-1',
          name: 'Arquitectura de Computadoras',
          color: '#3b82f6',
          notes: [
            {
              id: 'note-zoom-1',
              title: 'Procesadores y Pipelines',
              content: '<p>Contenido de prueba para el zoom.</p>',
              favorite: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ],
      activeSubjectId: 'sub-zoom-1',
      activeNoteId: 'note-zoom-1',
      activeView: 'editor'
    });

    useUIStore.setState({
      activeModal: null,
      toasts: [],
      editorZoom: 100
    });
  });

  it('renders zoom controls in the footer with default 100%', () => {
    render(<NoteEditor />);
    expect(screen.getByLabelText(/nivel de zoom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/acercar zoom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/alejar zoom/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restablecer zoom al 100%/i })).toHaveTextContent('100%');
  });

  it('increases zoom when clicking the plus button', () => {
    render(<NoteEditor />);
    const plusBtn = screen.getByLabelText(/acercar zoom/i);

    fireEvent.click(plusBtn);
    expect(useUIStore.getState().editorZoom).toBe(110);
    expect(screen.getByRole('button', { name: /restablecer zoom al 100%/i })).toHaveTextContent('110%');
  });

  it('decreases zoom when clicking the minus button', () => {
    render(<NoteEditor />);
    const minusBtn = screen.getByLabelText(/alejar zoom/i);

    fireEvent.click(minusBtn);
    expect(useUIStore.getState().editorZoom).toBe(90);
    expect(screen.getByRole('button', { name: /restablecer zoom al 100%/i })).toHaveTextContent('90%');
  });

  it('updates zoom when adjusting the range slider', () => {
    render(<NoteEditor />);
    const slider = screen.getByLabelText(/nivel de zoom/i);

    fireEvent.change(slider, { target: { value: '145' } });
    expect(useUIStore.getState().editorZoom).toBe(145);
    expect(screen.getByRole('button', { name: /restablecer zoom al 100%/i })).toHaveTextContent('145%');
  });

  it('resets zoom to 100% when clicking the percentage button', () => {
    useUIStore.setState({ editorZoom: 150 });
    render(<NoteEditor />);
    const resetBtn = screen.getByRole('button', { name: /restablecer zoom al 100%/i });
    expect(resetBtn).toHaveTextContent('150%');

    fireEvent.click(resetBtn);
    expect(useUIStore.getState().editorZoom).toBe(100);
    expect(screen.getByRole('button', { name: /restablecer zoom al 100%/i })).toHaveTextContent('100%');
  });

  it('handles keyboard shortcuts: Ctrl++ to zoom in, Ctrl+- to zoom out, Ctrl+0 to reset', () => {
    render(<NoteEditor />);

    fireEvent.keyDown(window, { key: '+', ctrlKey: true });
    expect(useUIStore.getState().editorZoom).toBe(110);

    fireEvent.keyDown(window, { key: '-', ctrlKey: true });
    expect(useUIStore.getState().editorZoom).toBe(100);

    fireEvent.keyDown(window, { key: '-', ctrlKey: true });
    expect(useUIStore.getState().editorZoom).toBe(90);

    fireEvent.keyDown(window, { key: '0', ctrlKey: true });
    expect(useUIStore.getState().editorZoom).toBe(100);
  });

  it('handles notebook trackpad pinch-to-zoom (wheel event with ctrlKey)', () => {
    const { container } = render(<NoteEditor />);
    const scrollArea = container.querySelector('[class*="editorScrollArea"]');
    expect(scrollArea).toBeInTheDocument();

    fireEvent.wheel(scrollArea, {
      ctrlKey: true,
      deltaY: -50
    });
    expect(useUIStore.getState().editorZoom).toBeGreaterThan(100);

    fireEvent.wheel(scrollArea, {
      ctrlKey: true,
      deltaY: 100
    });
    expect(useUIStore.getState().editorZoom).toBeLessThan(110);
  });

  it('handles touchscreen 2-finger pinch gesture', () => {
    const { container } = render(<NoteEditor />);
    const scrollArea = container.querySelector('[class*="editorScrollArea"]');

    fireEvent.touchStart(scrollArea, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 }
      ]
    });

    fireEvent.touchMove(scrollArea, {
      touches: [
        { clientX: 75, clientY: 100 },
        { clientX: 225, clientY: 100 }
      ]
    });

    expect(useUIStore.getState().editorZoom).toBe(150);

    fireEvent.touchEnd(scrollArea);
  });

  it('clamps zoom between min 50% and max 200%', () => {
    useUIStore.setState({ editorZoom: 195 });
    const { unmount } = render(<NoteEditor />);
    const plusBtn = screen.getByLabelText(/acercar zoom/i);

    fireEvent.click(plusBtn);
    expect(useUIStore.getState().editorZoom).toBe(200);
    expect(plusBtn).toBeDisabled();

    unmount();

    useUIStore.setState({ editorZoom: 50 });
    render(<NoteEditor />);
    const minusBtn = screen.getByLabelText(/alejar zoom/i);
    expect(minusBtn).toBeDisabled();
  });
});
