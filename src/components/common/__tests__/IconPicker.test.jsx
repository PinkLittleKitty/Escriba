import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconPicker } from '../IconPicker.jsx';

describe('IconPicker Component', () => {
  it('renders search input, category filters, and icon buttons', () => {
    render(<IconPicker selectedIcon="code" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/buscar icono/i)).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Sistemas & Computación')).toBeInTheDocument();
    expect(screen.getByTestId('icon-option-code')).toBeInTheDocument();
  });

  it('filters icons when searching by keyword', () => {
    render(<IconPicker selectedIcon={null} onChange={() => {}} />);
    const input = screen.getByPlaceholderText(/buscar icono/i);

    fireEvent.change(input, { target: { value: 'terminal' } });
    expect(screen.getByTestId('icon-option-terminal')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-option-book-open')).toBeNull();
  });

  it('filters icons by category', () => {
    render(<IconPicker selectedIcon={null} onChange={() => {}} />);
    const mathCategoryBtn = screen.getByText('Matemática & Datos');

    fireEvent.click(mathCategoryBtn);
    expect(screen.getByTestId('icon-option-calculator')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-option-terminal')).toBeNull();
  });

  it('calls onChange with icon id when clicked', () => {
    const handleChange = vi.fn();
    render(<IconPicker selectedIcon={null} onChange={handleChange} />);

    const atomBtn = screen.getByTestId('icon-option-atom');
    fireEvent.click(atomBtn);

    expect(handleChange).toHaveBeenCalledWith('atom');
  });

  it('calls onChange(null) when clicking Usar texto button', () => {
    const handleChange = vi.fn();
    render(
      <IconPicker
        selectedIcon="calculator"
        onChange={handleChange}
        fallbackText="MAT"
      />
    );

    const useTextBtn = screen.getByTestId('icon-use-text-btn');
    expect(useTextBtn).toHaveTextContent(/usar texto \(MAT\)/i);

    fireEvent.click(useTextBtn);
    expect(handleChange).toHaveBeenCalledWith(null);
  });
});
