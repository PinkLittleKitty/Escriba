export const handleMarkdownKeyDown = (e, { editorRoot, onInsertCodeBlock, onOpenLinkModal, onNotifyChange }) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;

  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;

  const range = sel.getRangeAt(0);
  if (!range.collapsed) return false;

  const node = range.startContainer;
  const offset = range.startOffset;

  if (e.key === '[') {
    if (node.nodeType === Node.TEXT_NODE) {
      const textBefore = node.textContent.substring(0, offset);
      if (textBefore.endsWith('[')) {
        e.preventDefault();
        const deleteRange = document.createRange();
        deleteRange.setStart(node, offset - 1);
        deleteRange.setEnd(node, offset);
        deleteRange.deleteContents();
        if (typeof onOpenLinkModal === 'function') {
          onOpenLinkModal();
        }
        return true;
      }
    }
  }

  if (e.key === ' ' || e.key === 'Spacebar') {
    if (node.nodeType !== Node.TEXT_NODE) return false;

    const textBefore = node.textContent.substring(0, offset);

    const rules = [
      { pattern: /^#{1,6}$/, type: 'heading', level: (m) => m[0].length },
      { pattern: /^([\-\*\+])$/, type: 'unordered-list' },
      { pattern: /^(1\.|1\))$/, type: 'ordered-list' },
      { pattern: /^>$/, type: 'blockquote' },
      { pattern: /^(\[\]|\[\s\])$/, type: 'task' },
      { pattern: /^(---|___|\*\*\*)$/, type: 'hr' },
      { pattern: /^```[a-zA-Z0-9_-]*$/, type: 'codeblock' }
    ];

    for (const rule of rules) {
      const match = textBefore.trim().match(rule.pattern);
      if (match) {
        e.preventDefault();

        const deleteRange = document.createRange();
        deleteRange.setStart(node, 0);
        deleteRange.setEnd(node, offset);
        deleteRange.deleteContents();

        let block = node.parentElement;
        while (block && block !== editorRoot && !/^(P|DIV|H[1-6]|BLOCKQUOTE|LI)$/i.test(block.tagName)) {
          block = block.parentElement;
        }

        if (rule.type === 'heading') {
          const level = rule.level(match);
          applyHeading(level, block, editorRoot, sel);
        } else if (rule.type === 'blockquote') {
          applyBlockquote(block, editorRoot, sel);
        } else if (rule.type === 'unordered-list') {
          document.execCommand('insertUnorderedList', false, null);
        } else if (rule.type === 'ordered-list') {
          document.execCommand('insertOrderedList', false, null);
        } else if (rule.type === 'task') {
          applyTask(sel);
        } else if (rule.type === 'hr') {
          document.execCommand('insertHorizontalRule', false, null);
        } else if (rule.type === 'codeblock') {
          if (typeof onInsertCodeBlock === 'function') {
            onInsertCodeBlock();
          }
        }

        if (typeof onNotifyChange === 'function') {
          onNotifyChange();
        }
        return true;
      }
    }
  }

  if (e.key === 'Backspace') {
    let block = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (block && block !== editorRoot && !/^(P|DIV|H[1-6]|BLOCKQUOTE|LI)$/i.test(block.tagName)) {
      block = block.parentElement;
    }

    if (block && block !== editorRoot) {
      const isHeading = /^H[1-6]$/i.test(block.tagName);
      const isBlockquote = /^BLOCKQUOTE$/i.test(block.tagName);
      const isLi = /^LI$/i.test(block.tagName);

      const isBlockEmpty = (block.textContent || '').trim() === '';
      const isAtStart = offset === 0 && (node === block || node === block.firstChild);

      if ((isHeading || isBlockquote) && (isBlockEmpty || isAtStart)) {
        e.preventDefault();
        const p = document.createElement('p');
        while (block.firstChild) {
          p.appendChild(block.firstChild);
        }
        if (!p.hasChildNodes() || p.innerHTML.trim() === '') {
          p.innerHTML = '<br>';
        }
        block.parentNode.replaceChild(p, block);

        const newRange = document.createRange();
        newRange.selectNodeContents(p);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        if (typeof onNotifyChange === 'function') {
          onNotifyChange();
        }
        return true;
      }

      if (isLi && isBlockEmpty) {
        e.preventDefault();
        document.execCommand('outdent', false, null);
        if (typeof onNotifyChange === 'function') {
          onNotifyChange();
        }
        return true;
      }
    }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    let block = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (block && block !== editorRoot && !/^(P|DIV|H[1-6]|BLOCKQUOTE)$/i.test(block.tagName)) {
      block = block.parentElement;
    }

    if (block && block !== editorRoot && /^H[1-6]$/i.test(block.tagName)) {
      const isAtEnd = isCaretAtEndOfBlock(range, block);
      if (isAtEnd) {
        e.preventDefault();
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        if (block.nextSibling) {
          block.parentNode.insertBefore(p, block.nextSibling);
        } else {
          block.parentNode.appendChild(p);
        }

        const newRange = document.createRange();
        newRange.selectNodeContents(p);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        if (typeof onNotifyChange === 'function') {
          onNotifyChange();
        }
        return true;
      }
    }
  }

  return false;
};

function applyHeading(level, block, editorRoot, sel) {
  const tagName = `h${level}`;
  if (block && block !== editorRoot && block.tagName.toLowerCase() !== 'li') {
    const heading = document.createElement(tagName);
    while (block.firstChild) {
      heading.appendChild(block.firstChild);
    }
    if (!heading.hasChildNodes() || heading.innerHTML.trim() === '') {
      heading.innerHTML = '<br>';
    }
    block.parentNode.replaceChild(heading, block);

    const newRange = document.createRange();
    newRange.selectNodeContents(heading);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  } else {
    document.execCommand('formatBlock', false, `<${tagName}>`);
  }
}

function applyBlockquote(block, editorRoot, sel) {
  if (block && block !== editorRoot && block.tagName.toLowerCase() !== 'li') {
    const bq = document.createElement('blockquote');
    while (block.firstChild) {
      bq.appendChild(block.firstChild);
    }
    if (!bq.hasChildNodes() || bq.innerHTML.trim() === '') {
      bq.innerHTML = '<br>';
    }
    block.parentNode.replaceChild(bq, block);

    const newRange = document.createRange();
    newRange.selectNodeContents(bq);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  } else {
    document.execCommand('formatBlock', false, '<blockquote>');
  }
}

function applyTask(sel) {
  const span = document.createElement('span');
  span.className = 'task-item';
  span.style.display = 'inline-flex';
  span.style.alignItems = 'center';
  span.style.gap = '6px';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.style.cursor = 'pointer';
  checkbox.style.margin = '0';
  checkbox.style.accentColor = 'var(--accent-blue, #3b82f6)';
  checkbox.onclick = (e) => {
    e.stopPropagation();
    if (checkbox.checked) {
      checkbox.parentElement?.style.setProperty('text-decoration', 'line-through');
      checkbox.parentElement?.style.setProperty('opacity', '0.7');
    } else {
      checkbox.parentElement?.style.removeProperty('text-decoration');
      checkbox.parentElement?.style.removeProperty('opacity');
    }
  };

  const range = sel.getRangeAt(0);
  range.insertNode(checkbox);
  range.setStartAfter(checkbox);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function isCaretAtEndOfBlock(range, block) {
  const clone = range.cloneRange();
  clone.selectNodeContents(block);
  clone.setStart(range.endContainer, range.endOffset);
  return clone.toString().trim() === '';
}
