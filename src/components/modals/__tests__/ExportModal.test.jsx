import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportModal } from '../ExportModal.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';
import * as exportHelpers from '../../../utils/exportHelpers.js';

describe('ExportModal Component', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [
        {
          id: 'sub-1',
          name: 'Sistemas Distribuidos',
          color: '#3b82f6',
          notes: [
            {
              id: 'note-1',
              title: 'Consenso Raft',
              content: '<p>Líderes y seguidores</p>',
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ],
      activeSubjectId: 'sub-1',
      activeNoteId: 'note-1'
    });

    useUIStore.setState({
      activeModal: 'export',
      modalData: null,
      toasts: []
    });

    vi.spyOn(exportHelpers, 'downloadFile').mockImplementation(() => { });
  });

  it('renders modal header for sharing and exporting', () => {
    render(<ExportModal />);
    expect(screen.getByText(/compartir apunte/i)).toBeInTheDocument();
  });

  it('switches to files tab and displays export format options', () => {
    render(<ExportModal />);
    const filesTab = screen.getByRole('button', { name: /exportar archivos/i });
    fireEvent.click(filesTab);

    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('Página Web')).toBeInTheDocument();
    expect(screen.getByText('JSON Backup')).toBeInTheDocument();
  });

  it('downloads Markdown file when clicking Markdown card', () => {
    render(<ExportModal />);
    const filesTab = screen.getByRole('button', { name: /exportar archivos/i });
    fireEvent.click(filesTab);

    const mdCard = screen.getByText('Markdown');
    fireEvent.click(mdCard);

    expect(exportHelpers.downloadFile).toHaveBeenCalledWith(
      expect.stringContaining('.md'),
      expect.any(String),
      expect.stringContaining('text/markdown')
    );
  });

  it('downloads HTML file when clicking HTML card', () => {
    render(<ExportModal />);
    const filesTab = screen.getByRole('button', { name: /exportar archivos/i });
    fireEvent.click(filesTab);

    const htmlCard = screen.getByText('Página Web');
    fireEvent.click(htmlCard);

    expect(exportHelpers.downloadFile).toHaveBeenCalledWith(
      expect.stringContaining('.html'),
      expect.any(String),
      expect.stringContaining('text/html')
    );
  });

  it('downloads JSON file when clicking JSON card', () => {
    render(<ExportModal />);
    const filesTab = screen.getByRole('button', { name: /exportar archivos/i });
    fireEvent.click(filesTab);

    const jsonCard = screen.getByText('JSON Backup');
    fireEvent.click(jsonCard);

    expect(exportHelpers.downloadFile).toHaveBeenCalledWith(
      expect.stringContaining('.json'),
      expect.any(String),
      expect.stringContaining('application/json')
    );
  });

  it('closes modal when clicking close button', () => {
    render(<ExportModal />);
    const closeBtn = screen.getByTitle(/cerrar/i);
    fireEvent.click(closeBtn);

    expect(useUIStore.getState().activeModal).toBe(null);
  });

  it('displays Imprimir Carpeta option when in subject mode', () => {
    useUIStore.setState({
      activeModal: 'export',
      modalData: {
        subject: {
          id: 'sub-1',
          name: 'Sistemas Distribuidos',
          notes: []
        }
      }
    });

    render(<ExportModal />);
    const filesTab = screen.getByRole('button', { name: /exportar archivos/i });
    fireEvent.click(filesTab);

    expect(screen.getByText(/imprimir carpeta/i)).toBeInTheDocument();
  });
});
