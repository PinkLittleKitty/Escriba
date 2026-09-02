import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('Header Component', () => {
  beforeEach(() => {
    useNotesStore.setState({
      activeView: 'dashboard'
    });
    useUIStore.setState({
      sidebarCollapsed: false,
      activeModal: null
    });
  });

  it('renders title "Escriba"', () => {
    render(<Header />);
    expect(screen.getByText('Escriba')).toBeInTheDocument();
  });

  it('does NOT render a hamburger menu button', () => {
    render(<Header />);
    expect(screen.queryByTitle(/menú lateral/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /menú lateral/i })).not.toBeInTheDocument();
  });

  it('navigates to Dashboard when title is clicked', () => {
    useNotesStore.setState({ activeView: 'editor' });
    render(<Header />);

    const title = screen.getByText('Escriba').closest('div');
    fireEvent.click(title);

    expect(useNotesStore.getState().activeView).toBe('dashboard');
  });

  it('switches views when desktop nav tabs are clicked', () => {
    render(<Header />);

    const editorTab = screen.getByRole('button', { name: /apuntes/i });
    fireEvent.click(editorTab);
    expect(useNotesStore.getState().activeView).toBe('editor');

    const calendarTab = screen.getByRole('button', { name: /calendario/i });
    fireEvent.click(calendarTab);
    expect(useNotesStore.getState().activeView).toBe('calendar');

    const panelTab = screen.getByRole('button', { name: /panel/i });
    fireEvent.click(panelTab);
    expect(useNotesStore.getState().activeView).toBe('dashboard');
  });

  it('opens Settings modal when settings button is clicked', () => {
    render(<Header />);
    const settingsBtn = screen.getByTitle(/ajustes/i);
    fireEvent.click(settingsBtn);

    expect(useUIStore.getState().activeModal).toBe('settings');
  });

  it('toggles desktop sidebar collapse state', () => {
    render(<Header />);
    const collapseBtn = screen.getByTitle(/barra lateral/i);

    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    fireEvent.click(collapseBtn);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });
});
