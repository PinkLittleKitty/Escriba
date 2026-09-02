import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMarkdownKeyDown } from '../markdownAutoFormat.js';

describe('markdownAutoFormat utility', () => {
  let editorRoot;

  beforeEach(() => {
    editorRoot = document.createElement('div');
    editorRoot.contentEditable = 'true';
    document.body.appendChild(editorRoot);
  });

  it('triggers onOpenLinkModal when typing second "[" bracket', () => {
    const p = document.createElement('p');
    const textNode = document.createTextNode('[');
    p.appendChild(textNode);
    editorRoot.appendChild(p);

    const sel = window.getSelection();
    const range = document.createRange();
    range.setStart(textNode, 1);
    range.setEnd(textNode, 1);
    sel.removeAllRanges();
    sel.addRange(range);

    const onOpenLinkModal = vi.fn();
    const mockEvent = {
      key: '[',
      preventDefault: vi.fn(),
      ctrlKey: false,
      metaKey: false,
      altKey: false
    };

    const handled = handleMarkdownKeyDown(mockEvent, {
      editorRoot,
      onOpenLinkModal
    });

    expect(handled).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(onOpenLinkModal).toHaveBeenCalled();
  });

  it('ignores events with modifier keys like Ctrl or Meta', () => {
    const mockEvent = {
      key: ' ',
      ctrlKey: true,
      metaKey: false,
      altKey: false
    };

    const handled = handleMarkdownKeyDown(mockEvent, { editorRoot });
    expect(handled).toBe(false);
  });
});
