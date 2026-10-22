import React, { useEffect, useRef } from 'react';
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/theme-github';

export const MermaidAceEditor = ({
  value = '',
  onChange,
  theme = 'dark',
  minLines = 8,
  maxLines = Infinity,
  fontSize = 13,
  className = '',
  readOnly = false,
  autoFocus = false,
  style = {}
}) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  const isLight = theme === 'light' || theme === 'peluche' || theme === 'catppuccin-latte';
  const aceTheme = isLight ? 'ace/theme/github' : 'ace/theme/tomorrow_night';

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = ace.edit(containerRef.current, {
      mode: 'ace/mode/markdown',
      theme: aceTheme,
      minLines,
      maxLines,
      fontSize,
      showPrintMargin: false,
      tabSize: 2,
      useSoftTabs: true,
      highlightActiveLine: !readOnly,
      readOnly,
      wrap: true,
      useWorker: false,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    });

    editor.session.setUseWorker(false);
    editor.setValue(value, -1);

    editor.on('change', () => {
      if (isInternalChange.current) return;
      const newVal = editor.getValue();
      if (onChange) {
        onChange(newVal);
      }
    });

    if (autoFocus) {
      editor.focus();
    }

    editorRef.current = editor;

    const resizeTimer = setTimeout(() => {
      editor.resize();
    }, 50);

    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        if (editorRef.current) {
          editorRef.current.resize();
        }
      });
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(resizeTimer);
      if (observer) observer.disconnect();
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.getValue() !== value) {
      isInternalChange.current = true;
      const cursor = editor.getCursorPosition();
      editor.setValue(value, -1);
      editor.moveCursorToPosition(cursor);
      isInternalChange.current = false;
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setTheme(aceTheme);
    }
  }, [aceTheme]);

  const stopProp = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseDown={stopProp}
      onClick={stopProp}
      onKeyDown={stopProp}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '280px',
        flex: 1,
        borderRadius: '0',
        lineHeight: 1.5,
        ...style
      }}
    />
  );
};
