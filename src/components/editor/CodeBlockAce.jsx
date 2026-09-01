import React, { useEffect, useRef, useState } from 'react';
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/theme-github';

import { Copy, Check, Trash2, Code2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import styles from './CodeBlock.module.css';

export const CodeBlockAce = ({
  code = '// Escribí tu código acá...',
  language = 'javascript',
  onChange,
  onDelete
}) => {
  const editorRef = useRef(null);
  const aceInstance = useRef(null);
  const theme = useSettingsStore((state) => state.theme);

  const [currentLang, setCurrentLang] = useState(language);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = ace.edit(editorRef.current, {
      mode: `ace/mode/${currentLang}`,
      theme: theme === 'light' || theme === 'sepia' ? 'ace/theme/github' : 'ace/theme/tomorrow_night',
      maxLines: 35,
      minLines: 4,
      fontSize: 14,
      showPrintMargin: false,
      tabSize: 2,
      useSoftTabs: true,
      highlightActiveLine: false,
      wrap: true
    });

    editor.setValue(code, -1);

    editor.on('change', () => {
      const val = editor.getValue();
      if (onChange) onChange(val);
    });

    aceInstance.current = editor;

    return () => {
      editor.destroy();
    };
  }, []);

  useEffect(() => {
    if (aceInstance.current) {
      aceInstance.current.setTheme(
        theme === 'light' || theme === 'sepia' ? 'ace/theme/github' : 'ace/theme/tomorrow_night'
      );
    }
  }, [theme]);

  const handleLangChange = (newLang) => {
    setCurrentLang(newLang);
    if (aceInstance.current) {
      aceInstance.current.session.setMode(`ace/mode/${newLang}`);
    }
  };

  const handleCopy = () => {
    if (aceInstance.current) {
      navigator.clipboard.writeText(aceInstance.current.getValue());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.codeBlockContainer} contentEditable={false}>
      <div className={styles.codeBlockHeader}>
        <div className={styles.headerLeft}>
          <Code2 size={14} color="var(--accent-blue)" />
          <select
            className={styles.languageSelect}
            value={currentLang}
            onChange={(e) => handleLangChange(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>

        <div className={styles.headerRight}>
          <button type="button" className={styles.actionBtn} onClick={handleCopy} title="Copiar código">
            {copied ? <Check size={13} color="var(--accent-green)" /> : <Copy size={13} />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
          {onDelete && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={onDelete}
              title="Eliminar bloque"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div ref={editorRef} className={styles.aceEditorHost} />
    </div>
  );
};
