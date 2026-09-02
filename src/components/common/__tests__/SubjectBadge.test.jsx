import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubjectBadge } from '../SubjectBadge.jsx';

describe('SubjectBadge Component', () => {
  it('renders text initials when subject has no icon', () => {
    const subject = {
      name: 'Programación Orientada a Objetos 2',
      code: 'PO2',
      color: '#ef4444'
    };

    render(<SubjectBadge subject={subject} />);
    const textEl = screen.getByTestId('subject-badge-text');
    expect(textEl).toHaveTextContent('PO2');
    expect(screen.queryByTestId('subject-badge-icon')).toBeNull();
  });

  it('renders Lucide icon when subject has a valid icon id', () => {
    const subject = {
      name: 'Algoritmos y Estructuras',
      code: 'AED',
      color: '#3b82f6',
      icon: 'code'
    };

    render(<SubjectBadge subject={subject} />);
    expect(screen.getByTestId('subject-badge-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('subject-badge-text')).toBeNull();
  });

  it('falls back to initials when subject icon is not found in map', () => {
    const subject = {
      name: 'Física Cuántica',
      code: 'FC',
      color: '#10b981',
      icon: 'non-existent-icon'
    };

    render(<SubjectBadge subject={subject} />);
    expect(screen.getByTestId('subject-badge-text')).toHaveTextContent('FC');
  });

  it('applies archived styling when isArchived is true', () => {
    const subject = {
      name: 'Matemática Discreta',
      color: '#8b5cf6',
      icon: 'calculator'
    };

    render(<SubjectBadge subject={subject} isArchived={true} />);
    const badge = screen.getByTestId('subject-badge');
    expect(badge).toHaveStyle({ backgroundColor: 'var(--text-muted)' });
  });

  it('returns null if subject is not provided', () => {
    const { container } = render(<SubjectBadge subject={null} />);
    expect(container.firstChild).toBeNull();
  });
});
