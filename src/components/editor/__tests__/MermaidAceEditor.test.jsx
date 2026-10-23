import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ace from 'ace-builds';
import { MermaidAceEditor } from '../MermaidAceEditor.jsx';

vi.mock('ace-builds/src-noconflict/mode-markdown', () => ({}));
vi.mock('ace-builds/src-noconflict/theme-tomorrow_night', () => ({}));
vi.mock('ace-builds/src-noconflict/theme-github', () => ({}));

vi.mock('ace-builds', () => {
  const fakeSession = {
    setUseWorker: vi.fn(),
  };
  const fakeEditor = {
    session: fakeSession,
    setValue: vi.fn(),
    getValue: vi.fn(() => ''),
    on: vi.fn(),
    focus: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
    setTheme: vi.fn(),
    getCursorPosition: vi.fn(() => ({ row: 0, column: 0 })),
    moveCursorToPosition: vi.fn(),
  };
  return {
    default: {
      edit: vi.fn(() => fakeEditor),
    },
  };
});

describe('MermaidAceEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes Ace with scrolling-friendly options and no maxLines/minLines by default', () => {
    const { container } = render(<MermaidAceEditor value="graph TD\n A --> B" />);

    expect(ace.edit).toHaveBeenCalledTimes(1);
    const [editorDomEl, options] = ace.edit.mock.calls[0];

    expect(editorDomEl).toBe(container.firstChild);
    expect(options.scrollPastEnd).toBe(0.5);
    expect(options.autoScrollEditorIntoView).toBe(false);
    expect(options.vScrollBarAlwaysVisible).toBe(false);
    expect(options.maxLines).toBeUndefined();
    expect(options.minLines).toBeUndefined();
  });

  it('ignores Infinity for maxLines so scrolling is not disabled', () => {
    render(<MermaidAceEditor value="graph TD\n A --> B" maxLines={Infinity} />);

    const [, options] = ace.edit.mock.calls[0];
    expect(options.maxLines).toBeUndefined();
  });

  it('passes finite minLines and maxLines if explicitly provided', () => {
    render(<MermaidAceEditor value="graph TD\n A --> B" minLines={5} maxLines={25} />);

    const [, options] = ace.edit.mock.calls[0];
    expect(options.minLines).toBe(5);
    expect(options.maxLines).toBe(25);
  });

  it('renders container with minHeight 0 and height 100% for proper flexbox scrolling', () => {
    const { container } = render(<MermaidAceEditor value="graph TD\n A --> B" />);
    const editorDiv = container.firstChild;

    expect(editorDiv.style.height).toBe('100%');
    expect(editorDiv.style.minHeight).toBe('0px');
  });
});
