import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  RemoveFormatting,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Link as LinkIcon,
  Table,
  Minus,
  Code,
  Terminal,
  Sigma,
  GitGraph
} from 'lucide-react';
import { ColorPicker } from '../common/ColorPicker.jsx';
import { useUIStore } from '../../store/useUIStore.js';
import styles from './EditorToolbar.module.css';

export const EditorToolbar = ({ onInsertCodeBlock, onInsertMath, onInsertUML, onInsertTable }) => {
  const openModal = useUIStore((state) => state.openModal);

  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  const fontMenuRef = useRef(null);
  const colorMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target)) {
        setShowFontMenu(false);
      }
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target)) {
        setShowColorMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exec = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleFontSize = (size) => {
    exec('fontSize', size);
    setShowFontMenu(false);
  };

  const handleTextColor = (color) => {
    exec('foreColor', color);
    setShowColorMenu(false);
  };

  const handleHighlight = () => {
    exec('hiliteColor', 'var(--highlight-bg, #fef08a)');
  };

  const handleInlineCode = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const codeNode = document.createElement('code');
      codeNode.style.cssText =
        'background: var(--bg-tertiary); padding: 0.15rem 0.35rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85em; color: var(--accent-blue);';
      codeNode.textContent = selectedText;
      range.deleteContents();
      range.insertNode(codeNode);
    }
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('bold')}
          title="Negrita (Ctrl+B)"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('italic')}
          title="Cursiva (Ctrl+I)"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('underline')}
          title="Subrayado (Ctrl+U)"
        >
          <Underline size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('strikeThrough')}
          title="Tachado"
        >
          <Strikethrough size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={handleHighlight}
          title="Resaltar"
        >
          <Highlighter size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('removeFormat')}
          title="Limpiar formato"
        >
          <RemoveFormatting size={15} />
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.toolbarGroup}>
        <div className={styles.dropdownWrapper} ref={fontMenuRef}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => setShowFontMenu(!showFontMenu)}
            title="Tamaño de letra"
          >
            <Type size={15} />
          </button>
          {showFontMenu && (
            <div className={styles.dropdownMenu}>
              <button type="button" className={styles.dropdownOption} onClick={() => handleFontSize('2')}>
                Chico
              </button>
              <button type="button" className={styles.dropdownOption} onClick={() => handleFontSize('3')}>
                Normal
              </button>
              <button type="button" className={styles.dropdownOption} onClick={() => handleFontSize('4')}>
                Grande
              </button>
              <button type="button" className={styles.dropdownOption} onClick={() => handleFontSize('5')}>
                Título
              </button>
              <button type="button" className={styles.dropdownOption} onClick={() => handleFontSize('6')}>
                Gigante
              </button>
            </div>
          )}
        </div>

        <div className={styles.dropdownWrapper} ref={colorMenuRef}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => setShowColorMenu(!showColorMenu)}
            title="Color de texto"
          >
            <Palette size={15} />
          </button>
          {showColorMenu && (
            <div className={styles.dropdownMenu} style={{ minWidth: '180px' }}>
              <ColorPicker onChange={handleTextColor} size="small" />
            </div>
          )}
        </div>
      </div>

      <div className={styles.separator} />

      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('justifyLeft')}
          title="Alinear izquierda"
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('justifyCenter')}
          title="Centrar"
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('justifyRight')}
          title="Alinear derecha"
        >
          <AlignRight size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('justifyFull')}
          title="Justificar"
        >
          <AlignJustify size={15} />
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('insertUnorderedList')}
          title="Lista con viñetas"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('insertOrderedList')}
          title="Lista numerada"
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('indent')}
          title="Aumentar sangría"
        >
          <Indent size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('outdent')}
          title="Reducir sangría"
        >
          <Outdent size={15} />
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => openModal('linkNote')}
          title="Enlazar otro apunte"
        >
          <LinkIcon size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onInsertTable}
          title="Insertar tabla"
        >
          <Table size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => exec('insertHorizontalRule')}
          title="Línea horizontal"
        >
          <Minus size={15} />
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={handleInlineCode}
          title="Código en línea (Ctrl+`)"
        >
          <Code size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onInsertCodeBlock}
          title="Insertar bloque de código con Ace"
        >
          <Terminal size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onInsertMath}
          title="Fórmula matemática (LaTeX)"
        >
          <Sigma size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onInsertUML}
          title="Diagrama UML (Mermaid)"
        >
          <GitGraph size={15} />
        </button>
      </div>
    </div>
  );
};
