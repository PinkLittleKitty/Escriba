import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorToolbar } from '../EditorToolbar.jsx';
import { useUIStore } from '../../../store/useUIStore.js';

describe('EditorToolbar Component', () => {
  beforeEach(() => {
    useUIStore.setState({ activeModal: null });
    document.execCommand = vi.fn();
  });

  it('triggers bold, italic, and underline execCommands', () => {
    render(
      <EditorToolbar
        onInsertCodeBlock={vi.fn()}
        onInsertMath={vi.fn()}
        onInsertUML={vi.fn()}
        onInsertTable={vi.fn()}
        isMathToolbarOpen={false}
        onToggleMathToolbar={vi.fn()}
      />
    );

    const boldBtn = screen.getByTitle(/negrita/i);
    fireEvent.click(boldBtn);
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);

    const italicBtn = screen.getByTitle(/cursiva/i);
    fireEvent.click(italicBtn);
    expect(document.execCommand).toHaveBeenCalledWith('italic', false, null);

    const underlineBtn = screen.getByTitle(/subrayado/i);
    fireEvent.click(underlineBtn);
    expect(document.execCommand).toHaveBeenCalledWith('underline', false, null);
  });

  it('opens and selects font size from dropdown menu', () => {
    render(
      <EditorToolbar
        onInsertCodeBlock={vi.fn()}
        onInsertMath={vi.fn()}
        onInsertUML={vi.fn()}
        onInsertTable={vi.fn()}
        isMathToolbarOpen={false}
        onToggleMathToolbar={vi.fn()}
      />
    );

    const fontBtn = screen.getByTitle(/tamaño de letra/i);
    fireEvent.click(fontBtn);

    const grandeOption = screen.getByRole('button', { name: /grande/i });
    expect(grandeOption).toBeInTheDocument();

    fireEvent.click(grandeOption);
    expect(document.execCommand).toHaveBeenCalledWith('fontSize', false, '4');
  });

  it('calls callback when inserting code block, table, math, and UML', () => {
    const onInsertCodeBlock = vi.fn();
    const onInsertTable = vi.fn();
    const onToggleMathToolbar = vi.fn();
    const onInsertUML = vi.fn();

    render(
      <EditorToolbar
        onInsertCodeBlock={onInsertCodeBlock}
        onInsertMath={vi.fn()}
        onInsertUML={onInsertUML}
        onInsertTable={onInsertTable}
        isMathToolbarOpen={false}
        onToggleMathToolbar={onToggleMathToolbar}
      />
    );

    const codeBtn = screen.getByTitle(/insertar bloque de código/i);
    fireEvent.click(codeBtn);
    expect(onInsertCodeBlock).toHaveBeenCalled();

    const tableBtn = screen.getByTitle(/insertar tabla/i);
    fireEvent.click(tableBtn);
    expect(onInsertTable).toHaveBeenCalled();

    const mathBtn = screen.getByTitle(/barra de símbolos matemáticos/i);
    fireEvent.click(mathBtn);
    expect(onToggleMathToolbar).toHaveBeenCalled();

    const umlBtn = screen.getByTitle(/diagrama uml/i);
    fireEvent.click(umlBtn);
    expect(onInsertUML).toHaveBeenCalled();
  });

  it('opens linkNote modal when clicking link note icon', () => {
    render(
      <EditorToolbar
        onInsertCodeBlock={vi.fn()}
        onInsertMath={vi.fn()}
        onInsertUML={vi.fn()}
        onInsertTable={vi.fn()}
        isMathToolbarOpen={false}
        onToggleMathToolbar={vi.fn()}
      />
    );

    const linkBtn = screen.getByTitle(/enlazar otro apunte/i);
    fireEvent.click(linkBtn);

    expect(useUIStore.getState().activeModal).toBe('linkNote');
  });

  it('triggers quick highlight with active highlight color', () => {
    render(
      <EditorToolbar
        onInsertCodeBlock={vi.fn()}
        onInsertMath={vi.fn()}
        onInsertUML={vi.fn()}
        onInsertTable={vi.fn()}
        isMathToolbarOpen={false}
        onToggleMathToolbar={vi.fn()}
      />
    );

    const highlightBtn = screen.getByTitle(/resaltar texto/i);
    fireEvent.click(highlightBtn);
    expect(document.execCommand).toHaveBeenCalledWith('hiliteColor', false, expect.any(String));
  });

  it('opens highlight color menu and selects a custom preset color', () => {
    render(
      <EditorToolbar
        onInsertCodeBlock={vi.fn()}
        onInsertMath={vi.fn()}
        onInsertUML={vi.fn()}
        onInsertTable={vi.fn()}
        isMathToolbarOpen={false}
        onToggleMathToolbar={vi.fn()}
      />
    );

    const arrowBtn = screen.getByTitle(/elegir color de resaltado/i);
    fireEvent.click(arrowBtn);

    const greenSwatch = screen.getByTitle('Verde');
    expect(greenSwatch).toBeInTheDocument();

    fireEvent.click(greenSwatch);
    expect(document.execCommand).toHaveBeenCalledWith('hiliteColor', false, '#bbf7d0');
  });

  it('clears highlight when Sin color is clicked', () => {
    render(
      <EditorToolbar
        onInsertCodeBlock={vi.fn()}
        onInsertMath={vi.fn()}
        onInsertUML={vi.fn()}
        onInsertTable={vi.fn()}
        isMathToolbarOpen={false}
        onToggleMathToolbar={vi.fn()}
      />
    );

    const arrowBtn = screen.getByTitle(/elegir color de resaltado/i);
    fireEvent.click(arrowBtn);

    const clearBtn = screen.getByTitle(/sin color de resaltado/i);
    fireEvent.click(clearBtn);

    expect(document.execCommand).toHaveBeenCalledWith('hiliteColor', false, 'transparent');
  });
});
