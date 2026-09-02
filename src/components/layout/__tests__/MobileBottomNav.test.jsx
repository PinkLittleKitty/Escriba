import React, { act } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileBottomNav } from '../MobileBottomNav.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('MobileBottomNav Component', () => {
  beforeEach(() => {
    useNotesStore.setState({
      activeView: 'dashboard',
      subjects: []
    });
    useUIStore.setState({
      sidebarOpen: false,
      activeModal: null
    });
  });

  it('renders all 4 navigation buttons', () => {
    render(<MobileBottomNav />);

    expect(screen.getByRole('button', { name: /inicio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agenda/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /carpeta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ajustes/i })).toBeInTheDocument();
  });

  it('navigates to Dashboard when Inicio is clicked', () => {
    useNotesStore.setState({ activeView: 'calendar' });
    useUIStore.setState({ sidebarOpen: true });

    render(<MobileBottomNav />);
    const inicioBtn = screen.getByRole('button', { name: /inicio/i });
    fireEvent.click(inicioBtn);

    expect(useNotesStore.getState().activeView).toBe('dashboard');
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('navigates to Calendar when Agenda is clicked', () => {
    render(<MobileBottomNav />);
    const agendaBtn = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaBtn);

    expect(useNotesStore.getState().activeView).toBe('calendar');
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('toggles bottom-sheet drawer when Carpeta is clicked', () => {
    render(<MobileBottomNav />);
    const carpetaBtn = screen.getByRole('button', { name: /carpeta/i });

    expect(useUIStore.getState().sidebarOpen).toBe(false);
    fireEvent.click(carpetaBtn);
    expect(useUIStore.getState().sidebarOpen).toBe(true);

    fireEvent.click(carpetaBtn);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('opens Settings modal and closes drawer when Ajustes is clicked', () => {
    useUIStore.setState({ sidebarOpen: true });

    render(<MobileBottomNav />);
    const ajustesBtn = screen.getByRole('button', { name: /ajustes/i });
    fireEvent.click(ajustesBtn);

    expect(useUIStore.getState().activeModal).toBe('settings');
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('highlights the active navigation button properly', () => {
    useNotesStore.setState({ activeView: 'dashboard' });
    useUIStore.setState({ sidebarOpen: false });

    const { rerender } = render(<MobileBottomNav />);
    expect(screen.getByRole('button', { name: /inicio/i })).toHaveClass(/active/);

    act(() => {
      useNotesStore.setState({ activeView: 'calendar' });
    });
    rerender(<MobileBottomNav />);
    expect(screen.getByRole('button', { name: /agenda/i })).toHaveClass(/active/);

    act(() => {
      useNotesStore.setState({ activeView: 'editor' });
    });
    rerender(<MobileBottomNav />);
    expect(screen.getByRole('button', { name: /carpeta/i })).toHaveClass(/active/);
  });
});
