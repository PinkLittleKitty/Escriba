import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Search,
  Copy,
  Check,
  Download,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  ArrowDown,
  CornerDownLeft
} from 'lucide-react';
import { useLoggerStore } from '../../store/useLoggerStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { loggerService } from '../../services/loggerService.js';
import styles from './DevConsole.module.css';

export const DevConsole = () => {
  const isConsoleOpen = useUIStore((state) => state.isConsoleOpen);
  const closeConsole = useUIStore((state) => state.closeConsole);
  const addToast = useUIStore((state) => state.addToast);

  const logs = useLoggerStore((state) => state.logs);
  const filter = useLoggerStore((state) => state.filter);
  const setFilter = useLoggerStore((state) => state.setFilter);
  const searchTerm = useLoggerStore((state) => state.searchTerm);
  const setSearchTerm = useLoggerStore((state) => state.setSearchTerm);
  const autoScroll = useLoggerStore((state) => state.autoScroll);
  const setAutoScroll = useLoggerStore((state) => state.setAutoScroll);
  const clearLogs = useLoggerStore((state) => state.clear);
  const commandHistory = useLoggerStore((state) => state.commandHistory);
  const addCommandHistory = useLoggerStore((state) => state.addCommandHistory);

  const [height, setHeight] = useState(320);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);

  const logStreamRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(320);

  const filteredLogs = logs.filter((entry) => {
    if (filter !== 'all' && entry.level !== filter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        entry.message.toLowerCase().includes(q) ||
        entry.level.toLowerCase().includes(q) ||
        entry.timestamp.includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: logs.length,
    info: logs.filter((l) => l.level === 'info').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    error: logs.filter((l) => l.level === 'error').length,
    debug: logs.filter((l) => l.level === 'debug').length
  };

  useEffect(() => {
    if (autoScroll && logStreamRef.current && isConsoleOpen) {
      logStreamRef.current.scrollTop = logStreamRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isConsoleOpen]);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = height;

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const delta = startYRef.current - moveEvent.clientY;
      const newHeight = Math.min(Math.max(startHeightRef.current + delta, 160), window.innerHeight * 0.85);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCopyLogs = async () => {
    const text = useLoggerStore.getState().getFormattedLogText();
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      addToast({ message: 'Logs copiados al portapapeles', type: 'success' });
    } catch {
      addToast({ message: 'Error al copiar los logs', type: 'error' });
    }
  };

  const handleDownloadLogs = () => {
    const text = useLoggerStore.getState().getFormattedLogText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `escriba-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
    link.click();
    URL.revokeObjectURL(url);
    addToast({ message: 'Archivo de logs descargado', type: 'info' });
  };

  const handleRunCommand = (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    addCommandHistory(commandInput.trim());
    loggerService.executeCommand(commandInput.trim());
    setCommandInput('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setCommandInput(commandHistory[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setCommandInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      }
    }
  };

  if (!isConsoleOpen) return null;

  return (
    <div
      className={styles.consoleWrapper}
      style={{ height: isMaximized ? '85vh' : `${height}px` }}
    >
      <div className={styles.resizeHandle} onMouseDown={handleMouseDown} />

      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Terminal size={15} />
          <span>Debug Console</span>
        </div>

        <div className={styles.controlsArea}>
          <div className={styles.filters}>
            <button
              type="button"
              className={`${styles.filterChip} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos <span className={styles.countBadge}>{counts.all}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filter === 'info' ? styles.active : ''}`}
              onClick={() => setFilter('info')}
            >
              Info <span className={styles.countBadge}>{counts.info}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filter === 'warn' ? styles.active : ''}`}
              onClick={() => setFilter('warn')}
            >
              Warn <span className={styles.countBadge}>{counts.warn}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filter === 'error' ? styles.active : ''}`}
              onClick={() => setFilter('error')}
            >
              Error <span className={styles.countBadge}>{counts.error}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filter === 'debug' ? styles.active : ''}`}
              onClick={() => setFilter('debug')}
            >
              Debug <span className={styles.countBadge}>{counts.debug}</span>
            </button>
          </div>

          <div className={styles.searchBox}>
            <Search size={12} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Filtrar logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.iconBtn}
                style={{ width: 16, height: 16 }}
                onClick={() => setSearchTerm('')}
              >
                <X size={10} />
              </button>
            )}
          </div>

          <div className={styles.actionBtns}>
            <button
              type="button"
              className={`${styles.iconBtn} ${autoScroll ? styles.active : ''}`}
              onClick={() => setAutoScroll(!autoScroll)}
              title={autoScroll ? 'Auto-scroll activo' : 'Auto-scroll pausado'}
            >
              <ArrowDown size={14} />
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleCopyLogs}
              title="Copiar todos los logs"
            >
              {isCopied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleDownloadLogs}
              title="Descargar archivo .log"
            >
              <Download size={14} />
            </button>

            <button
              type="button"
              className={`${styles.iconBtn} ${styles.danger}`}
              onClick={clearLogs}
              title="Limpiar consola"
            >
              <Trash2 size={14} />
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? 'Restaurar tamaño' : 'Maximizar'}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={closeConsole}
              title="Cerrar consola (Ctrl+Alt+D)"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      <div ref={logStreamRef} className={styles.logStream}>
        {filteredLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <Terminal size={24} />
            <span>No hay registros en la consola para este filtro.</span>
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const time = entry.timestamp.split('T')[1]?.split('.')[0] || entry.timestamp;
            return (
              <div
                key={entry.id}
                className={`${styles.logEntry} ${styles[`entry_${entry.level}`] || ''}`}
              >
                <span className={styles.logTime}>[{time}]</span>
                <span className={`${styles.levelBadge} ${styles[`level_${entry.level}`] || ''}`}>
                  {entry.level}
                </span>
                <span className={styles.logMsg}>
                  {entry.message}
                  {entry.count > 1 && (
                    <span className={styles.dedupeBadge}>×{entry.count}</span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      <form className={styles.replBar} onSubmit={handleRunCommand}>
        <span className={styles.replPrompt}>&gt;</span>
        <input
          type="text"
          className={styles.replInput}
          placeholder="..."
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.quickChips}>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => loggerService.executeCommand('help')}
          >
            help
          </button>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => loggerService.executeCommand('stats')}
          >
            stats
          </button>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => loggerService.executeCommand('notesStore.subjects')}
          >
            subjects
          </button>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => loggerService.executeCommand('settingsStore')}
          >
            settings
          </button>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => useLoggerStore.getState().clear()}
          >
            clear()
          </button>
        </div>
        <button
          type="submit"
          className={styles.iconBtn}
          title="Ejecutar comando (Enter)"
        >
          <CornerDownLeft size={14} />
        </button>
      </form>
    </div>
  );
};
