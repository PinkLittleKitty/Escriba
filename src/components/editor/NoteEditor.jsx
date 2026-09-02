import React, { useState, useEffect, useRef } from 'react';
import * as ReactDOM from 'react-dom/client';
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';

import {
  Star,
  Printer,
  Share2,
  Trash2,
  FileText,
  Clock,
  Link as LinkIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MinusCircle,
  Paintbrush
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import { EditorToolbar } from './EditorToolbar.jsx';
import { UMLBlock } from './UMLBlock.jsx';
import { MathBlock } from './MathBlock.jsx';
import { MathToolbar } from './MathToolbar.jsx';
import { formatDate, calculateReadingStats, debounce } from '../../utils/helpers.js';
import styles from './NoteEditor.module.css';

const TABLE_PALETTE = [
  { bg: 'transparent', text: 'inherit', label: 'Sin color' },
  { bg: '#fee2e2', text: '#991b1b', label: 'Rojo suave' },
  { bg: '#fef3c7', text: '#92400e', label: 'Amarillo suave' },
  { bg: '#dcfce7', text: '#166534', label: 'Verde suave' },
  { bg: '#dbeafe', text: '#1e40af', label: 'Azul suave' },
  { bg: '#f3e8ff', text: '#6b21a8', label: 'Violeta suave' },
  { bg: '#e2e8f0', text: '#334155', label: 'Gris suave' },
];

export const NoteEditor = () => {
  const subjects = useNotesStore((state) => state.subjects);
  const activeSubjectId = useNotesStore((state) => state.activeSubjectId);
  const activeNoteId = useNotesStore((state) => state.activeNoteId);

  const updateNote = useNotesStore((state) => state.updateNote);
  const toggleFavorite = useNotesStore((state) => state.toggleFavorite);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const setActiveNote = useNotesStore((state) => state.setActiveNote);

  const addToast = useUIStore((state) => state.addToast);
  const openModal = useUIStore((state) => state.openModal);
  const autoSave = useSettingsStore((state) => state.autoSave);
  const theme = useSettingsStore((state) => state.theme);

  const contentRef = useRef(null);
  const aceEditorsRef = useRef(new Map());
  const umlRootsRef = useRef(new Map());
  const mathRootsRef = useRef(new Map());
  const currentNoteRef = useRef(null);
  const titleRef = useRef('');

  const [mathToolbarOpen, setMathToolbarOpen] = useState(false);

  const [tableMenu, setTableMenu] = useState(null);

  let currentSubject = subjects.find((s) => s.id === activeSubjectId);
  let currentNote = null;

  for (const s of subjects) {
    const found = s.notes.find((n) => n.id === activeNoteId);
    if (found) {
      currentNote = found;
      currentSubject = s;
      break;
    }
  }

  const [title, setTitle] = useState('');
  const [stats, setStats] = useState({ words: 0, chars: 0, readingTime: 0 });

  currentNoteRef.current = currentNote;
  titleRef.current = title;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (tableMenu && !e.target.closest('.table-context-menu')) {
        setTableMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [tableMenu]);

  const debouncedSave = useRef(
    debounce((noteId, newTitle, newContent) => {
      updateNote(noteId, { title: newTitle, content: newContent });
    }, 400)
  ).current;

  const initAceEditors = () => {
    if (!contentRef.current) return;
    const containers = contentRef.current.querySelectorAll('.inline-ace-editor');

    containers.forEach((container) => {
      if (container.getAttribute('data-initialized') === 'true' && aceEditorsRef.current.has(container)) {
        return;
      }

      if (!container.id) {
        container.id = `ace-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      }

      const code = container.getAttribute('data-code') || container.innerText || '// Escribí tu código acá...';
      const lang = container.getAttribute('data-lang') || 'javascript';
      const aceTheme = theme === 'light' || theme === 'sakura' ? 'ace/theme/github' : 'ace/theme/tomorrow_night';

      container.innerHTML = '';
      container.style.height = '110px';
      container.style.minHeight = '60px';
      container.style.position = 'relative';

      try {
        const editor = ace.edit(container.id, {
          mode: `ace/mode/${lang}`,
          theme: aceTheme,
          maxLines: 40,
          minLines: 3,
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          showPrintMargin: false,
          tabSize: 4,
          useSoftTabs: true,
          highlightActiveLine: true,
          wrap: true
        });

        editor.setValue(code, -1);
        container.setAttribute('data-initialized', 'true');
        aceEditorsRef.current.set(container, editor);

        const parentBlock = container.closest('.code-block-container');
        if (parentBlock) {
          parentBlock.setAttribute('data-code', code);
          let printPre = parentBlock.querySelector('.print-code-block');
          if (!printPre) {
            printPre = document.createElement('pre');
            printPre.className = 'print-code-block';
            const printCodeEl = document.createElement('code');
            printPre.appendChild(printCodeEl);
            parentBlock.appendChild(printPre);
          }
          const printCodeEl = printPre.querySelector('code') || printPre;
          printCodeEl.textContent = code;

          editor.session.on('change', () => {
            const val = editor.getValue();
            container.setAttribute('data-code', val);
            parentBlock.setAttribute('data-code', val);
            if (printCodeEl) printCodeEl.textContent = val;
            const note = currentNoteRef.current;
            if (autoSave !== false && note) {
              debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
            }
          });
          const titleEl = parentBlock.querySelector('.code-block-title');
          if (titleEl && (titleEl.querySelector('i') || !titleEl.querySelector('svg'))) {
            const text = titleEl.textContent?.trim() || 'Bloque de Código';
            titleEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg> ${text}`;
          }

          const deleteBtn = parentBlock.querySelector('.code-block-delete-btn');
          if (deleteBtn) {
            if (deleteBtn.querySelector('i') || !deleteBtn.querySelector('svg')) {
              deleteBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
            }

            deleteBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              editor.destroy();
              aceEditorsRef.current.delete(container);
              parentBlock.remove();
              const note = currentNoteRef.current;
              if (note) {
                debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
              }
            };
          }
        }
      } catch (err) {
        console.error('Error mounting Ace editor:', err);
      }
    });
  };

  useEffect(() => {
    const aceTheme = theme === 'light' || theme === 'sakura' ? 'ace/theme/github' : 'ace/theme/tomorrow_night';
    aceEditorsRef.current.forEach((editor) => {
      try {
        editor.setTheme(aceTheme);
      } catch (e) { }
    });
  }, [theme]);

  const initUMLBlocks = () => {
    if (!contentRef.current) return;

    const legacyBlocks = contentRef.current.querySelectorAll('.uml-diagram-container');
    legacyBlocks.forEach((legacy) => {
      const code = legacy.getAttribute('data-uml-code') || '';
      const sentinel = document.createElement('div');
      sentinel.className = 'uml-block-container';
      sentinel.setAttribute('data-uml-code', code);
      sentinel.setAttribute('data-initialized', 'false');
      sentinel.setAttribute('contenteditable', 'false');
      legacy.replaceWith(sentinel);
    });

    const containers = contentRef.current.querySelectorAll('.uml-block-container');

    containers.forEach((el) => {
      if (el.getAttribute('data-initialized') === 'true' && umlRootsRef.current.has(el)) return;

      const elRef = el;

      const handleUMLChange = (newCode) => {
        elRef.setAttribute('data-uml-code', newCode);
        const note = currentNoteRef.current;
        if (note) {
          debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
        }
      };

      const handleUMLDelete = () => {
        const root = umlRootsRef.current.get(elRef);
        if (root) {
          root.unmount();
          umlRootsRef.current.delete(elRef);
        }
        elRef.remove();
        const note = currentNoteRef.current;
        if (note) {
          debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
        }
      };

      const initialCode = el.getAttribute('data-uml-code') ||
        'graph TD\n  A[Inicio] --> B{¿Es correcto?}\n  B -->|Sí| C[Continuar]\n  B -->|No| D[Revisar]';

      el.setAttribute('data-initialized', 'true');
      el.innerHTML = '';

      const root = ReactDOM.createRoot(el);
      root.render(
        <UMLBlock
          code={initialCode}
          onChange={handleUMLChange}
          onDelete={handleUMLDelete}
        />
      );
      umlRootsRef.current.set(el, root);
    });
  };

  const initMathBlocks = () => {
    if (!contentRef.current) return;

    const legacyMaths = contentRef.current.querySelectorAll('div[style*="accent-cyan"]');
    legacyMaths.forEach((legacy) => {
      const text = legacy.textContent || '';
      const formula = text.replace(/^\$\$/, '').replace(/\$\$$/, '').trim() || 'f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi';
      const sentinel = document.createElement('div');
      sentinel.className = 'math-block-container';
      sentinel.setAttribute('data-math-code', formula);
      sentinel.setAttribute('data-initialized', 'false');
      sentinel.setAttribute('contenteditable', 'false');
      legacy.replaceWith(sentinel);
    });

    const containers = contentRef.current.querySelectorAll('.math-block-container');

    containers.forEach((el) => {
      if (el.getAttribute('data-initialized') === 'true' && mathRootsRef.current.has(el)) return;

      const elRef = el;

      const handleMathChange = (newCode) => {
        elRef.setAttribute('data-math-code', newCode);
        const note = currentNoteRef.current;
        if (note) {
          debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
        }
      };

      const handleMathDelete = () => {
        const root = mathRootsRef.current.get(elRef);
        if (root) {
          root.unmount();
          mathRootsRef.current.delete(elRef);
        }
        elRef.remove();
        const note = currentNoteRef.current;
        if (note) {
          debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
        }
      };

      const initialFormula = el.getAttribute('data-math-code') ||
        'f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi';

      el.setAttribute('data-initialized', 'true');
      el.innerHTML = '';

      const root = ReactDOM.createRoot(el);
      root.render(
        <MathBlock
          formula={initialFormula}
          onChange={handleMathChange}
          onDelete={handleMathDelete}
        />
      );
      mathRootsRef.current.set(el, root);
    });
  };

  useEffect(() => {
    aceEditorsRef.current.forEach((editor) => {
      try { editor.destroy(); } catch (e) { }
    });
    aceEditorsRef.current.clear();

    umlRootsRef.current.forEach((root) => {
      try { root.unmount(); } catch (e) { }
    });
    umlRootsRef.current.clear();

    mathRootsRef.current.forEach((root) => {
      try { root.unmount(); } catch (e) { }
    });
    mathRootsRef.current.clear();

    if (currentNote) {
      setTitle(currentNote.title || '');
      if (contentRef.current) {
        contentRef.current.innerHTML = currentNote.content || '';
      }
      setStats(calculateReadingStats(currentNote.content || ''));

      setTimeout(() => {
        initAceEditors();
        initUMLBlocks();
        initMathBlocks();
      }, 50);
    }
  }, [activeNoteId]);

  useEffect(() => {
    const handleBeforePrint = () => {
      if (!contentRef.current) return;
      const containers = contentRef.current.querySelectorAll('.code-block-container');
      containers.forEach((parentBlock) => {
        const aceEl = parentBlock.querySelector('.inline-ace-editor');
        const editor = aceEl ? aceEditorsRef.current.get(aceEl) : null;
        let code = editor ? editor.getValue() : (aceEl?.getAttribute('data-code') || '');

        if (!code && aceEl) {
          const scroller = aceEl.querySelector('.ace_scroller');
          code = (scroller ? scroller.innerText : aceEl.innerText || '').replace(/^\s*[0-9]+\s*\n/gm, '').trim();
        }

        let printPre = parentBlock.querySelector('.print-code-block');
        if (!printPre) {
          printPre = document.createElement('pre');
          printPre.className = 'print-code-block';
          const printCodeEl = document.createElement('code');
          printPre.appendChild(printCodeEl);
          parentBlock.appendChild(printPre);
        }
        const printCodeEl = printPre.querySelector('code') || printPre;
        printCodeEl.textContent = code;
      });
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, []);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentNote && autoSave !== false) {
      debouncedSave(currentNote.id, newTitle, contentRef.current?.innerHTML || '');
    }
  };

  const handleContentInput = () => {
    if (!currentNote || !contentRef.current) return;
    const html = contentRef.current.innerHTML;
    setStats(calculateReadingStats(html));

    if (autoSave !== false) {
      debouncedSave(currentNote.id, title, html);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (!currentNote) return;
    openModal('export', { note: currentNote });
  };

  const handleInsertTable = () => {
    openModal('table');
  };

  const handleContextMenu = (e) => {
    const cell = e.target.closest('td, th');
    if (cell && contentRef.current?.contains(cell)) {
      e.preventDefault();
      const menuWidth = 250;
      const menuHeight = 360;
      const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
      const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);
      setTableMenu({ x, y, cell });
    } else {
      setTableMenu(null);
    }
  };

  const executeTableAction = (action) => {
    if (!tableMenu?.cell) return;
    const cell = tableMenu.cell;
    const row = cell.parentElement;
    const table = row.closest('table');
    if (!table) return;

    const rowIndex = row.rowIndex;
    const cellIndex = cell.cellIndex;

    switch (action) {
      case 'insert-row-above': {
        const newRow = table.insertRow(rowIndex);
        const colCount = row.cells.length;
        for (let i = 0; i < colCount; i++) {
          const newCell = newRow.insertCell();
          newCell.contentEditable = 'true';
          newCell.innerHTML = '<br>';
        }
        break;
      }
      case 'insert-row-below': {
        const newRow = table.insertRow(rowIndex + 1);
        const colCount = row.cells.length;
        for (let i = 0; i < colCount; i++) {
          const newCell = newRow.insertCell();
          newCell.contentEditable = 'true';
          newCell.innerHTML = '<br>';
        }
        break;
      }
      case 'insert-col-left': {
        for (let i = 0; i < table.rows.length; i++) {
          const r = table.rows[i];
          const isHeader = r.parentElement?.tagName === 'THEAD' || r.cells[0]?.tagName === 'TH';
          const newCell = document.createElement(isHeader ? 'th' : 'td');
          newCell.contentEditable = 'true';
          newCell.innerHTML = isHeader ? 'Encabezado' : '<br>';
          r.insertBefore(newCell, r.cells[cellIndex] || null);
        }
        break;
      }
      case 'insert-col-right': {
        for (let i = 0; i < table.rows.length; i++) {
          const r = table.rows[i];
          const isHeader = r.parentElement?.tagName === 'THEAD' || r.cells[0]?.tagName === 'TH';
          const newCell = document.createElement(isHeader ? 'th' : 'td');
          newCell.contentEditable = 'true';
          newCell.innerHTML = isHeader ? 'Encabezado' : '<br>';
          r.insertBefore(newCell, r.cells[cellIndex + 1] || null);
        }
        break;
      }
      case 'delete-row': {
        table.deleteRow(rowIndex);
        if (table.rows.length === 0) table.remove();
        break;
      }
      case 'delete-col': {
        for (let i = table.rows.length - 1; i >= 0; i--) {
          const r = table.rows[i];
          if (r.cells[cellIndex]) {
            r.deleteCell(cellIndex);
          }
        }
        if (table.rows[0]?.cells.length === 0) table.remove();
        break;
      }
      case 'delete-table': {
        table.remove();
        break;
      }
      default:
        break;
    }

    setTableMenu(null);
    const note = currentNoteRef.current;
    if (note) {
      debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
    }
  };

  const executeTableColor = (bgColor, textColor) => {
    if (!tableMenu?.cell) return;
    tableMenu.cell.style.backgroundColor = bgColor;
    if (textColor) {
      tableMenu.cell.style.color = textColor;
    }
    setTableMenu(null);
    const note = currentNoteRef.current;
    if (note) {
      debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
    }
  };

  const handleInsertCodeBlock = () => {
    const aceId = `ace-${Date.now()}`;
    const initialCode = '// Escribí tu código acá...\n';
    const blockHTML = `
      <div class="code-block-container" contenteditable="false" data-code="${initialCode}">
        <div class="code-block-header">
          <span class="code-block-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            Bloque de Código
          </span>
          <div class="code-block-actions">
            <button type="button" class="code-block-delete-btn" title="Eliminar bloque">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <div id="${aceId}" class="inline-ace-editor" data-code="${initialCode}"></div>
        <pre class="print-code-block"><code>${initialCode}</code></pre>
      </div>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, blockHTML);
    setTimeout(() => {
      initAceEditors();
      if (currentNote) {
        debouncedSave(currentNote.id, title, contentRef.current?.innerHTML || '');
      }
    }, 50);
  };

  const handleToggleMathToolbar = () => {
    setMathToolbarOpen((prev) => !prev);
  };

  const handleInsertSymbol = (item) => {
    if (window.__lastActiveMathBlockId) {
      window.dispatchEvent(new CustomEvent('escriba-insert-math-symbol', { detail: item }));
      return;
    }

    if (!contentRef.current) return;
    document.execCommand('insertText', false, item.symbol);
    const note = currentNoteRef.current;
    if (note) {
      debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
    }
  };

  const handleInsertStructure = (item) => {
    if (window.__lastActiveMathBlockId) {
      window.dispatchEvent(new CustomEvent('escriba-insert-math-symbol', { detail: item }));
      return;
    }

    handleInsertMathBlock(item.latex);
  };

  const handleInsertMathBlock = (defaultFormula) => {
    if (!contentRef.current) return;

    const formula =
      typeof defaultFormula === 'string'
        ? defaultFormula
        : 'f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi';

    const sentinel = document.createElement('div');
    sentinel.className = 'math-block-container';
    sentinel.setAttribute('data-math-code', formula);
    sentinel.setAttribute('data-initialized', 'false');
    sentinel.setAttribute('contenteditable', 'false');

    const spacer = document.createElement('p');
    spacer.innerHTML = '<br>';

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (contentRef.current.contains(range.commonAncestorContainer)) {
        range.collapse(false);
        range.insertNode(spacer);
        range.insertNode(sentinel);
        range.setStartAfter(spacer);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        contentRef.current.appendChild(sentinel);
        contentRef.current.appendChild(spacer);
      }
    } else {
      contentRef.current.appendChild(sentinel);
      contentRef.current.appendChild(spacer);
    }

    setTimeout(() => {
      initMathBlocks();
      const note = currentNoteRef.current;
      if (note) {
        debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
      }
    }, 50);
  };

  const handleInsertUML = () => {
    if (!contentRef.current) return;

    const defaultCode = 'graph TD\n  A[Inicio] --> B{¿Es correcto?}\n  B -->|Sí| C[Continuar]\n  B -->|No| D[Revisar]';

    const sentinel = document.createElement('div');
    sentinel.className = 'uml-block-container';
    sentinel.setAttribute('data-uml-code', defaultCode);
    sentinel.setAttribute('data-initialized', 'false');
    sentinel.setAttribute('contenteditable', 'false');

    const spacer = document.createElement('p');
    spacer.innerHTML = '<br>';

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (contentRef.current.contains(range.commonAncestorContainer)) {
        range.collapse(false);
        range.insertNode(spacer);
        range.insertNode(sentinel);
      } else {
        contentRef.current.appendChild(sentinel);
        contentRef.current.appendChild(spacer);
      }
    } else {
      contentRef.current.appendChild(sentinel);
      contentRef.current.appendChild(spacer);
    }

    setTimeout(() => {
      initUMLBlocks();
      const note = currentNoteRef.current;
      if (note) {
        debouncedSave(note.id, titleRef.current, contentRef.current?.innerHTML || '');
      }
    }, 50);
  };

  const backlinks = [];
  if (currentNote && currentNote.title) {
    const searchTarget = currentNote.title.toLowerCase();
    subjects.forEach((s) => {
      s.notes.forEach((n) => {
        if (n.id !== currentNote.id && n.content && n.content.toLowerCase().includes(searchTarget)) {
          backlinks.push({ note: n, subject: s });
        }
      });
    });
  }

  if (!currentNote) {
    return (
      <div className={styles.editorContainer}>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No hay ningún apunte seleccionado. Elegí uno del panel lateral o creá uno nuevo.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editorContainer}>
      <div className={styles.noteHeader}>
        <div className={styles.titleSection}>
          <input
            type="text"
            className={styles.titleInput}
            value={title}
            onChange={handleTitleChange}
            placeholder="Apunte sin título"
          />
          {currentSubject && (
            <div className={styles.breadcrumb}>
              <span
                className={styles.subjectDot}
                style={{ backgroundColor: currentSubject.color || 'var(--accent-blue)' }}
              />
              <span>{currentSubject.name}</span>
            </div>
          )}
        </div>

        <div className={styles.metaActions}>
          <button
            type="button"
            className={`btn-icon ${currentNote.favorite ? 'active' : ''}`}
            onClick={() => toggleFavorite(currentNote.id)}
            title={currentNote.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
          >
            <Star
              size={18}
              fill={currentNote.favorite ? 'var(--accent-yellow)' : 'none'}
              color={currentNote.favorite ? 'var(--accent-yellow)' : 'currentColor'}
            />
          </button>

          <button
            type="button"
            className="btn-icon"
            onClick={handlePrint}
            title="Imprimir / Exportar PDF"
          >
            <Printer size={18} />
          </button>

          <button
            type="button"
            className="btn-icon"
            onClick={handleShare}
            title="Compartir apunte"
          >
            <Share2 size={18} />
          </button>

          <span className={styles.updatedDate}>
            {formatDate(currentNote.updatedAt || currentNote.createdAt)}
          </span>

          <button
            type="button"
            className="btn-icon"
            onClick={() => deleteNote(currentNote.id)}
            title="Eliminar apunte"
            style={{ color: 'var(--accent-red)' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <EditorToolbar
        onInsertCodeBlock={handleInsertCodeBlock}
        onInsertMath={handleInsertMathBlock}
        onInsertUML={handleInsertUML}
        onInsertTable={handleInsertTable}
        isMathToolbarOpen={mathToolbarOpen}
        onToggleMathToolbar={handleToggleMathToolbar}
      />

      {mathToolbarOpen && (
        <MathToolbar
          onInsertSymbol={handleInsertSymbol}
          onInsertStructure={handleInsertStructure}
          onInsertMathBlock={handleInsertMathBlock}
        />
      )}

      <div className={styles.editorScrollArea}>
        <div
          ref={contentRef}
          className={styles.editorBody}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentInput}
          onContextMenu={handleContextMenu}
          onFocus={() => {
            window.__lastActiveMathBlockId = null;
          }}
          onMouseDown={(e) => {
            if (!e.target.closest('.math-block-container')) {
              window.__lastActiveMathBlockId = null;
            }
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
              e.preventDefault();
              handleToggleMathToolbar();
            }
            if (e.key === 'Tab') {
              e.preventDefault();
              document.execCommand('insertText', false, '    ');
            }
          }}
          data-placeholder="Empezá a escribir tus apuntes acá... Usá Tab para sangría, Ctrl+B para negrita, Ctrl+I para cursiva."
        />
      </div>

      {tableMenu && (
        <div
          className="table-context-menu"
          style={{
            position: 'fixed',
            left: `${tableMenu.x}px`,
            top: `${tableMenu.y}px`,
            zIndex: 10000
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="menu-item" onClick={() => executeTableAction('insert-row-above')}>
            <ArrowUp size={14} />
            <span>Insertar fila arriba</span>
          </div>
          <div className="menu-item" onClick={() => executeTableAction('insert-row-below')}>
            <ArrowDown size={14} />
            <span>Insertar fila abajo</span>
          </div>
          <div className="menu-divider" />
          <div className="menu-item" onClick={() => executeTableAction('insert-col-left')}>
            <ArrowLeft size={14} />
            <span>Insertar columna a la izquierda</span>
          </div>
          <div className="menu-item" onClick={() => executeTableAction('insert-col-right')}>
            <ArrowRight size={14} />
            <span>Insertar columna a la derecha</span>
          </div>
          <div className="menu-divider" />
          <div className="menu-item data-destructive" onClick={() => executeTableAction('delete-row')}>
            <MinusCircle size={14} />
            <span>Eliminar fila</span>
          </div>
          <div className="menu-item data-destructive" onClick={() => executeTableAction('delete-col')}>
            <MinusCircle size={14} />
            <span>Eliminar columna</span>
          </div>
          <div className="menu-item data-destructive" onClick={() => executeTableAction('delete-table')}>
            <Trash2 size={14} />
            <span>Eliminar tabla</span>
          </div>
          <div className="menu-divider" />
          <div className="menu-color-picker">
            <span className="color-label">
              <Paintbrush size={12} />
              <span>Fondo de celda</span>
            </span>
            <div className="color-options-grid">
              {TABLE_PALETTE.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="color-picker-dot"
                  style={{ backgroundColor: p.bg }}
                  title={p.label}
                  onClick={() => executeTableColor(p.bg, p.text)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {backlinks.length > 0 && (
        <div className={styles.backlinksPanel}>
          <div className={styles.backlinksHeader}>
            <LinkIcon size={14} color="var(--accent-blue)" />
            <span>Menciones a este apunte ({backlinks.length})</span>
          </div>
          <div className={styles.backlinksList}>
            {backlinks.map(({ note, subject }) => (
              <button
                key={note.id}
                type="button"
                className={styles.backlinkTag}
                onClick={() => setActiveNote(subject.id, note.id)}
              >
                {subject.name} &rsaquo; {note.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.editorFooter}>
        <div className={styles.statsGroup}>
          <div className={styles.statItem}>
            <FileText size={13} />
            <span>{stats.words} palabras</span>
          </div>
          <div className={styles.statItem}>
            <span>{stats.chars} caracteres</span>
          </div>
          <div className={styles.statItem}>
            <Clock size={13} />
            <span>{stats.readingTime} min lectura</span>
          </div>
        </div>
      </div>
    </div>
  );
};
