import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DesktopDownloadPopup } from '../DesktopDownloadPopup.jsx';
import { storageService } from '../../../services/storageService.js';

describe('DesktopDownloadPopup Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.spyOn(storageService, 'isElectron').mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the popup in browser environment after timer fires', () => {
    render(<DesktopDownloadPopup />);

    expect(screen.queryByText(/Escriba para escritorio/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText(/Escriba para escritorio/i)).toBeInTheDocument();
    const downloadLink = screen.getByRole('link', { name: /descargar/i });
    expect(downloadLink).toHaveAttribute(
      'href',
      'https://github.com/PinkLittleKitty/Escriba/releases/tag/nightly'
    );
    expect(downloadLink).toHaveAttribute('target', '_blank');
  });

  it('does not render if running in Electron', () => {
    vi.spyOn(storageService, 'isElectron').mockReturnValue(true);

    render(<DesktopDownloadPopup />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.queryByText(/Escriba para escritorio/i)).not.toBeInTheDocument();
  });

  it('does not render if previously dismissed', () => {
    localStorage.setItem('escriba_desktop_dismissed', 'true');

    render(<DesktopDownloadPopup />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.queryByText(/Escriba para escritorio/i)).not.toBeInTheDocument();
  });

  it('dismisses popup and remembers choice when close button is clicked', () => {
    render(<DesktopDownloadPopup />);

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    const closeBtn = screen.getByTitle(/cerrar/i);
    fireEvent.click(closeBtn);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(localStorage.getItem('escriba_desktop_dismissed')).toBe('true');
    expect(screen.queryByText(/Escriba para escritorio/i)).not.toBeInTheDocument();
  });

  it('dismisses popup and remembers choice when "Más tarde" is clicked', () => {
    render(<DesktopDownloadPopup />);

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    const laterBtn = screen.getByRole('button', { name: /más tarde/i });
    fireEvent.click(laterBtn);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(localStorage.getItem('escriba_desktop_dismissed')).toBe('true');
    expect(screen.queryByText(/Escriba para escritorio/i)).not.toBeInTheDocument();
  });
});
