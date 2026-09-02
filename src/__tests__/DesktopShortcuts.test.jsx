import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { App } from '../App.jsx';
import { useNotesStore } from '../store/useNotesStore.js';
import { useUIStore } from '../store/useUIStore.js';

describe('Desktop Keyboard Shortcuts', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [
        {
          id: 'sub-1',
          name: 'Laboratorio',
          color: '#3b82f6',
          notes: []
        }
      ],
      activeSubjectId: 'sub-1',
      activeNoteId: null,
      activeView: 'dashboard'
    });

    useUIStore.setState({
      activeModal: null,
      sidebarCollapsed: false,
      isConsoleOpen: false,
      toasts: []
    });
  });

  it('Alt+N opens the subject modal', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 'n', altKey: true, ctrlKey: true });
    expect(useUIStore.getState().activeModal).toBe('subject');
  });

  it('Ctrl+N creates a new note in the active subject and switches to editor', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true, altKey: false, shiftKey: false });
    const sub = useNotesStore.getState().subjects[0];
    expect(sub.notes.length).toBe(1);
    expect(sub.notes[0].title).toBe('Nuevo Apunte');
    expect(useNotesStore.getState().activeView).toBe('editor');
  });

  it('Ctrl+Shift+S opens the export modal', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 's', ctrlKey: true, shiftKey: true, altKey: false });
    expect(useUIStore.getState().activeModal).toBe('export');
  });

  it('Alt+E opens the event modal', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 'e', ctrlKey: true, altKey: true });
    expect(useUIStore.getState().activeModal).toBe('event');
  });

  it('Alt+D toggles the developer console', () => {
    render(<App />);

    expect(useUIStore.getState().isConsoleOpen).toBe(false);
    fireEvent.keyDown(window, { key: 'd', ctrlKey: true, altKey: true });
    expect(useUIStore.getState().isConsoleOpen).toBe(true);
  });

  it('Ctrl+\\ toggles desktop sidebar collapse', () => {
    render(<App />);

    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    fireEvent.keyDown(window, { key: '\\', ctrlKey: true });
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });
});
