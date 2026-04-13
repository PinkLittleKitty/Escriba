class Logger {
    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        this.buffer = [];
        this.originalConsole = {
            log: console.log.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
            info: console.info.bind(console),
            debug: console.debug.bind(console)
        };
        this.isIntercepted = false;
    }

    init() {
        if (this.isIntercepted) return;

        console.log = (...args) => this._cap('info', ...args);
        console.warn = (...args) => this._cap('warn', ...args);
        console.error = (...args) => this._cap('error', ...args);
        console.info = (...args) => this._cap('info', ...args);
        console.debug = (...args) => this._cap('debug', ...args);

        this.isIntercepted = true;
        this.info('Sitema de logs de Escriba inicializado.');
    }

    _cap(level, ...args) {
        this.originalConsole[level === 'error' ? 'error' : (level === 'warn' ? 'warn' : 'log')](...args);

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message: args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' '),
            raw: args
        };

        this.buffer.push(entry);
        if (this.buffer.length > this.maxSize) {
            this.buffer.shift();
        }

        window.dispatchEvent(new CustomEvent('escriba-log', { detail: entry }));
    }

    getLogs() {
        return this.buffer;
    }

    clear() {
        this.buffer = [];
        window.dispatchEvent(new CustomEvent('escriba-logs-cleared'));
    }

    info(msg) { this._cap('info', msg); }
    warn(msg) { this._cap('warn', msg); }
    error(msg) { this._cap('error', msg); }
    debug(msg) { this._cap('debug', msg); }
}

export const logger = new Logger();
