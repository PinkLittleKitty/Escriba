import React, { act } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from '../SettingsModal.jsx';
import { useSettingsStore } from '../../../store/useSettingsStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('SettingsModal Component', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: 'dark',
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
      autoSave: true,
      expandSubjects: false,
      showWelcome: true,
      storageMode: 'local'
    });
    useUIStore.setState({
      activeModal: 'settings',
      settingsTab: 'general'
    });
  });

  it('renders settings modal header', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Ajustes de Escriba')).toBeInTheDocument();
  });

  it('navigates between settings tabs', () => {
    render(<SettingsModal />);

    const aparienciaTab = screen.getByRole('button', { name: /apariencia/i });
    fireEvent.click(aparienciaTab);
    expect(screen.getByText(/tema visual/i)).toBeInTheDocument();

    const ayudaTab = screen.getByRole('button', { name: /ayuda/i });
    fireEvent.click(ayudaTab);
    expect(screen.getByText(/atajos de teclado/i)).toBeInTheDocument();
  });

  it('switches theme when clicking a theme card in appearance tab', () => {
    render(<SettingsModal />);
    const aparienciaTab = screen.getByRole('button', { name: /apariencia/i });
    fireEvent.click(aparienciaTab);

    const claroTheme = screen.getByText('Claro');
    fireEvent.click(claroTheme.closest('div'));
    expect(useSettingsStore.getState().theme).toBe('light');

    const latteTheme = screen.getByText('Catppuccin Latte');
    fireEvent.click(latteTheme.closest('div'));
    expect(useSettingsStore.getState().theme).toBe('catppuccin-latte');

    const mochaTheme = screen.getByText('Catppuccin Mocha');
    fireEvent.click(mochaTheme.closest('div'));
    expect(useSettingsStore.getState().theme).toBe('catppuccin-mocha');
  });

  it('shows desktop shortcuts in Ayuda tab', () => {
    render(<SettingsModal />);
    const ayudaTab = screen.getByRole('button', { name: /ayuda/i });
    act(() => {
      fireEvent.click(ayudaTab);
    });

    expect(screen.getByText(/nuevo apunte/i)).toBeInTheDocument();
    expect(screen.getByText(/guardar cambios/i)).toBeInTheDocument();
  });

  it('closes modal when clicking close button', () => {
    render(<SettingsModal />);
    const closeBtn = screen.getByTitle(/cerrar/i);
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(useUIStore.getState().activeModal).toBe(null);
  });
});
