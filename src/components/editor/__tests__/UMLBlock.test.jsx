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
    expect(screen.getByTitle(/abrir en estudio/i)).toBeInTheDocument();
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

  it('opens Estudio UML modal when clicking Estudio UML button', () => {
    render(<UMLBlock code="graph TD\n  A --> B" />);

    const studioBtn = screen.getByTitle(/abrir en estudio/i);
    fireEvent.click(studioBtn);

    expect(screen.getByTitle(/cerrar estudio/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/cerrar estudio/i));
    expect(screen.queryByTitle(/cerrar estudio/i)).not.toBeInTheDocument();
  });

  it('opens export submenu and displays export options', () => {
    render(<UMLBlock code="graph TD\n  A --> B" />);

    const exportBtn = screen.getByTitle(/exportar y copiar/i);
    fireEvent.click(exportBtn);

    expect(screen.getByText('Copiar SVG')).toBeInTheDocument();
    expect(screen.getByText('Copiar Código')).toBeInTheDocument();
    expect(screen.getByText('Descargar SVG')).toBeInTheDocument();
    expect(screen.getByText('Descargar PNG')).toBeInTheDocument();
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

  it('renders vertical height resize bar and resizes height on drag', () => {
    const { container } = render(<UMLBlock code="graph TD\n  A --> B" />);
    const resizeBar = screen.getByTestId('uml-height-resize-bar');
    expect(resizeBar).toBeInTheDocument();

    const previewEl = container.querySelector('[class*="previewArea"]');
    expect(previewEl.style.height).toBe('520px');

    fireEvent.mouseDown(resizeBar, { clientY: 500 });
    fireEvent.mouseMove(window, { clientY: 650 });
    fireEvent.mouseUp(window);

    expect(previewEl.style.height).toBe('670px');

    fireEvent.doubleClick(resizeBar);
    expect(previewEl.style.height).toBe('520px');
  });

  it('does not pan canvas when clicking near the bottom-right corner of preview area', () => {
    const { container } = render(<UMLBlock code="graph TD\n  A --> B" />);
    const previewEl = container.querySelector('[class*="previewArea"]');

    vi.spyOn(previewEl, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 500,
      bottom: 520,
      width: 500,
      height: 520,
    });

    const svgCanvas = container.querySelector('[class*="svgCanvas"]');
    const initialTransform = svgCanvas.style.transform;

    fireEvent.mouseDown(previewEl, { clientX: 250, clientY: 515 });
    fireEvent.mouseMove(previewEl, { clientX: 250, clientY: 600 });
    fireEvent.mouseUp(previewEl);

    expect(svgCanvas.style.transform).toBe(initialTransform);
  });
});
