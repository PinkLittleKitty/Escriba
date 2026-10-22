import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UMLBlock } from '../UMLBlock.jsx';
import { UML_PRESETS } from '../umlPresets.js';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockImplementation((id, code) =>
      Promise.resolve({ svg: `<svg id="${id}"><text>${code}</text></svg>` })
    ),
  },
}));

vi.mock('../MermaidAceEditor.jsx', () => ({
  MermaidAceEditor: ({ value, onChange }) => (
    <div data-testid="mock-ace-editor">
      <textarea
        data-testid="ace-textarea"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  ),
}));

describe('UMLBlock Component (Mermaid Live features)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders UML block with tabs and header title', () => {
    render(<UMLBlock code="graph TD\n  A --> B" />);
    expect(screen.getByText('Diagrama UML')).toBeInTheDocument();
    expect(screen.getByTitle(/vista previa interactiva/i)).toBeInTheDocument();
    expect(screen.getByTitle(/vista dividida/i)).toBeInTheDocument();
    expect(screen.getByTitle(/editor de código/i)).toBeInTheDocument();
    expect(screen.getByTitle(/modo estudio/i)).toBeInTheDocument();
  });

  it('switches between preview, split, and code tabs', () => {
    render(<UMLBlock code="graph TD\n  A --> B" />);

    fireEvent.click(screen.getByTitle(/vista dividida/i));
    expect(screen.getByTestId('mock-ace-editor')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/editor de código/i));
    expect(screen.getByTestId('mock-ace-editor')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/vista previa interactiva/i));
    expect(screen.queryByTestId('mock-ace-editor')).not.toBeInTheDocument();
  });

  it('opens and applies preset template from dropdown', () => {
    const onChange = vi.fn();
    render(<UMLBlock code="graph TD\n  A --> B" onChange={onChange} />);

    const presetsBtn = screen.getByTitle(/galería de plantillas/i);
    fireEvent.click(presetsBtn);

    expect(screen.getByText('Diagrama de Secuencia')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Diagrama de Secuencia'));
    expect(onChange).toHaveBeenCalledWith(
      expect.stringContaining('sequenceDiagram')
    );
  });

  it('opens Mermaid Live Studio modal when clicking Modo Estudio button', () => {
    render(<UMLBlock code="graph TD\n  A --> B" />);

    const studioBtn = screen.getByTitle(/modo estudio/i);
    fireEvent.click(studioBtn);

    expect(screen.getByText('Mermaid Live Studio')).toBeInTheDocument();
    expect(screen.getByTitle(/cerrar estudio/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/cerrar estudio/i));
    expect(screen.queryByText('Mermaid Live Studio')).not.toBeInTheDocument();
  });

  it('allows zoom controls to increase, decrease, and reset zoom', () => {
    render(<UMLBlock code="graph TD\n  A --> B" />);

    expect(screen.getByText('100%')).toBeInTheDocument();

    const zoomInBtn = screen.getByTitle(/acercar/i);
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('115%')).toBeInTheDocument();

    const zoomOutBtn = screen.getByTitle(/alejar/i);
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();

    const resetBtn = screen.getByTitle(/restablecer/i);
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<UMLBlock code="graph TD\n  A --> B" onDelete={onDelete} />);

    const deleteBtn = screen.getByTitle(/eliminar bloque/i);
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('includes data-uml-code attribute for exportHelpers compatibility', () => {
    const testCode = 'graph TD\n  A --> B';
    const { container } = render(<UMLBlock code={testCode} />);
    const umlContainer = container.querySelector('[data-uml-code]');
    expect(umlContainer).toBeInTheDocument();
    expect(umlContainer.getAttribute('data-uml-code')).toBe(testCode);
  });
});
