import { useLoggerStore } from '../store/useLoggerStore.js';

class LoggerService {
  constructor() {
    this.isIntercepted = false;
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console)
    };
  }

  init() {
    if (this.isIntercepted) return;

    console.log = (...args) => this._capture('info', ...args);
    console.info = (...args) => this._capture('info', ...args);
    console.warn = (...args) => this._capture('warn', ...args);
    console.error = (...args) => this._capture('error', ...args);
    console.debug = (...args) => this._capture('debug', ...args);

    window.addEventListener('error', (event) => {
      this._capture('error', `[Unhandled Error] ${event.message} (${event.filename}:${event.lineno})`, event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this._capture('error', `[Unhandled Promise Rejection]`, event.reason);
    });

    this.isIntercepted = true;
  }

  _capture(level, ...args) {
    const origFn = this.originalConsole[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'] || this.originalConsole.log;
    try {
      origFn(...args);
    } catch {
    }

    const message = args
      .map((arg) => {
        if (arg instanceof Error) {
          return arg.stack || `${arg.name}: ${arg.message}`;
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    useLoggerStore.getState().addLog({
      level,
      message,
      timestamp: new Date().toISOString()
    });
  }

  async executeCommand(code) {
    if (!code || !code.trim()) return;

    const trimmed = code.trim();
    this._capture('debug', `> ${trimmed}`);

    if (trimmed === 'clear' || trimmed === 'clear()') {
      useLoggerStore.getState().clear();
      return;
    }

    if (trimmed === 'help' || trimmed === 'help()' || trimmed === '?') {
      const helpText = [
        '• help / ?           : Muestra esta guía de ayuda',
        '• clear / clear()    : Limpia todos los registros de la consola',
        '• stats / stats()    : Muestra estadísticas de materias, apuntes y configuración',
        '• theme("name")      : Cambia el tema (dark, light, sakura, github, catppuccin, blue, matcha, unq, sunset)',
        '',
        '• notesStore         : Estado de notas (notesStore.subjects, notesStore.activeNoteId, etc.)',
        '• settingsStore      : Configuración (theme, fontSize, fontFamily, autoSave, etc.)',
        '• uiStore            : Estado de UI (activeModal, sidebarCollapsed, etc.)',
        '',
        '• Podés ejecutar cualquier código JavaScript válido directamente (ej: notesStore.subjects.map(s => s.name))'
      ].join('\n');
      this._capture('info', helpText);
      return;
    }

    if (trimmed === 'stats' || trimmed === 'stats()') {
      const notesState = window.__notesStore || {};
      const subjects = notesState.subjects || [];
      const totalNotes = subjects.reduce((acc, s) => acc + (s.notes ? s.notes.length : 0), 0);
      const favNotes = subjects.reduce((acc, s) => acc + (s.notes ? s.notes.filter((n) => n.favorite).length : 0), 0);
      const settings = window.__settingsStore || {};
      const statsText = [
        `• Total Materias: ${subjects.length}`,
        `• Total Apuntes: ${totalNotes}`,
        `• Apuntes Favoritos: ${favNotes}`,
        `• Tema: ${settings.theme || 'dark'}`,
        `• Tipografía: ${settings.fontFamily || 'Inter'}`,
        `• Tamaño de Fuente: ${settings.fontSize || 16}px`
      ].join('\n');
      this._capture('info', statsText);
      return;
    }

    try {
      const scope = {
        get notesStore() {
          return window.__notesStore || null;
        },
        get settingsStore() {
          return window.__settingsStore || null;
        },
        get uiStore() {
          return window.__uiStore || null;
        },
        theme(name) {
          if (window.__settingsStore?.setTheme) {
            window.__settingsStore.setTheme(name);
            return `Tema cambiado a: ${name}`;
          }
          return 'settingsStore no disponible';
        }
      };

      const fn = new Function('scope', `with(scope) { return (${trimmed}); }`);
      const result = await fn(scope);

      this._capture('info', `< ${typeof result === 'object' && result !== null ? JSON.stringify(result, null, 2) : String(result)}`);
    } catch (err) {
      try {
        const fn = new Function('scope', `with(scope) { ${trimmed} }`);
        const result = await fn({});
        if (result !== undefined) {
          this._capture('info', `< ${typeof result === 'object' && result !== null ? JSON.stringify(result, null, 2) : String(result)}`);
        }
      } catch (err2) {
        this._capture('error', `< Error: ${err2.message}`);
      }
    }
  }
}

export const loggerService = new LoggerService();
