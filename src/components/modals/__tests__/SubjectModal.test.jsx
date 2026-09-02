import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubjectModal } from '../SubjectModal.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('SubjectModal Component', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [],
      deletedItems: []
    });
    useUIStore.setState({
      activeModal: 'subject',
      modalData: null,
      toasts: []
    });
  });

  it('renders "Nueva Materia" in create mode', () => {
    render(<SubjectModal />);
    expect(screen.getByText('Nueva Materia')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/algoritmos y estructuras/i)).toBeInTheDocument();
  });

  it('submits form and creates a new subject in store', () => {
    render(<SubjectModal />);

    const nameInput = screen.getByPlaceholderText(/algoritmos y estructuras/i);
    const codeInput = screen.getByPlaceholderText(/AED/i);
    const profInput = screen.getByPlaceholderText(/lic\. gómez/i);

    fireEvent.change(nameInput, { target: { value: 'Sistemas Operativos' } });
    fireEvent.change(codeInput, { target: { value: 'SO-2026' } });
    fireEvent.change(profInput, { target: { value: 'Tanenbaum' } });

    const form = screen.getByRole('button', { name: /crear materia/i }).closest('form');
    fireEvent.submit(form);

    const state = useNotesStore.getState();
    expect(state.subjects.length).toBe(1);
    expect(state.subjects[0].name).toBe('Sistemas Operativos');
    expect(state.subjects[0].code).toBe('SO-2026');
    expect(state.subjects[0].professor).toBe('Tanenbaum');
    expect(useUIStore.getState().activeModal).toBe(null);
  });

  it('renders in edit mode with pre-filled data', () => {
    useNotesStore.setState({
      subjects: [
        {
          id: 'sub-existing',
          name: 'Física I',
          code: 'FIS1',
          professor: 'Newton',
          color: '#10b981',
          schedule: [],
          notes: []
        }
      ]
    });

    useUIStore.setState({
      activeModal: 'subject',
      modalData: {
        id: 'sub-existing',
        name: 'Física I',
        code: 'FIS1',
        professor: 'Newton',
        color: '#10b981',
        schedule: []
      }
    });

    render(<SubjectModal />);
    expect(screen.getByText('Editar Materia')).toBeInTheDocument();

    const nameInput = screen.getByDisplayValue('Física I');
    expect(nameInput).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: 'Física II' } });
    const form = screen.getByRole('button', { name: /guardar cambios/i }).closest('form');
    fireEvent.submit(form);

    const sub = useNotesStore.getState().subjects.find((s) => s.id === 'sub-existing');
    expect(sub?.name).toBe('Física II');
    expect(useUIStore.getState().activeModal).toBe(null);
  });

  it('adds and removes schedule rows', () => {
    render(<SubjectModal />);
    const scheduleTab = screen.getByRole('button', { name: /horarios/i });
    fireEvent.click(scheduleTab);

    const addRowBtn = screen.getByRole('button', { name: /agregar horario/i });

    expect(screen.queryByTitle(/quitar/i)).not.toBeInTheDocument();
    fireEvent.click(addRowBtn);
    expect(screen.getByTitle(/quitar/i)).toBeInTheDocument();

    const removeBtn = screen.getByTitle(/quitar/i);
    fireEvent.click(removeBtn);
    expect(screen.queryByTitle(/quitar/i)).not.toBeInTheDocument();
  });

  it('closes modal when clicking close button', () => {
    render(<SubjectModal />);
    const closeBtn = screen.getByTitle(/cerrar/i);
    fireEvent.click(closeBtn);

    expect(useUIStore.getState().activeModal).toBe(null);
  });

  it('selects an icon from the icon library and saves it with the subject', () => {
    render(<SubjectModal />);

    const nameInput = screen.getByPlaceholderText(/algoritmos y estructuras/i);
    fireEvent.change(nameInput, { target: { value: 'Bases de Datos' } });

    const dbIconBtn = screen.getByTestId('icon-option-database');
    fireEvent.click(dbIconBtn);

    const form = screen.getByRole('button', { name: /crear materia/i }).closest('form');
    fireEvent.submit(form);

    const createdSub = useNotesStore.getState().subjects.find((s) => s.name === 'Bases de Datos');
    expect(createdSub).toBeDefined();
    expect(createdSub?.icon).toBe('database');
  });

  it('navigates between tabs and clicking hero badge switches to icon tab', () => {
    render(<SubjectModal />);

    const infoTab = screen.getByRole('button', { name: /información/i });
    const iconTab = screen.getByRole('button', { name: /icono & distintivo/i });
    const scheduleTab = screen.getByRole('button', { name: /horarios/i });

    expect(infoTab).toHaveClass(/active/);

    fireEvent.click(scheduleTab);
    expect(scheduleTab).toHaveClass(/active/);
    expect(screen.getByText(/días y horas de cursada/i)).toBeInTheDocument();

    fireEvent.click(infoTab);
    expect(infoTab).toHaveClass(/active/);

    const badgeBtn = screen.getByTitle(/click para cambiar icono/i);
    fireEvent.click(badgeBtn);
    expect(iconTab).toHaveClass(/active/);
  });
});
