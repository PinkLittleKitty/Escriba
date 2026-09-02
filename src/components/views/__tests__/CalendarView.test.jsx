import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from '../CalendarView.jsx';
import { useNotesStore } from '../../../store/useNotesStore.js';
import { useUIStore } from '../../../store/useUIStore.js';

describe('CalendarView Component', () => {
  beforeEach(() => {
    useNotesStore.setState({
      subjects: [],
      events: [
        {
          id: 'ev-1',
          title: 'Entrega de TP',
          date: '2026-09-15',
          type: 'tp',
          subjectId: null
        }
      ]
    });

    useUIStore.setState({
      activeModal: null
    });
  });

  it('renders calendar weekdays header and today button', () => {
    render(<CalendarView />);
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Vie')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hoy/i })).toBeInTheDocument();
  });

  it('navigates to next and previous months', () => {
    render(<CalendarView />);
    const nextBtn = screen.getByTitle(/mes siguiente/i);
    const prevBtn = screen.getByTitle(/mes anterior/i);

    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
  });

  it('opens event modal when clicking new event button', () => {
    render(<CalendarView />);
    const newEventBtn = screen.getByRole('button', { name: /nuevo/i });
    fireEvent.click(newEventBtn);

    expect(useUIStore.getState().activeModal).toBe('event');
  });
});
