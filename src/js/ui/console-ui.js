export class ConsoleUI {
    constructor() {
        this.container = null;
        this.body = null;
        this.activeFilter = 'all';
        this.isOpen = false;
        this.logger = null;
    }

    init(loggerInstance) {
        this.logger = loggerInstance;
        this.createMarkdown();
        this.bindEvents();
        this.renderInitialLogs();
    }

    createMarkdown() {
        const consoleEl = document.createElement('div');
        consoleEl.id = 'escribaConsole';
        consoleEl.className = 'dev-console';
        consoleEl.innerHTML = `
            <div class="console-header">
                <div class="console-title">
                    <i class="fas fa-terminal"></i>
                    <span>DEBUG CONSOLE</span>
                </div>
                <div class="console-controls">
                    <div class="console-filter">
                        <button class="filter-chip active" data-filter="all">All</button>
                        <button class="filter-chip" data-filter="info">Info</button>
                        <button class="filter-chip" data-filter="warn">Warn</button>
                        <button class="filter-chip" data-filter="error">Error</button>
                    </div>
                    <button class="console-btn" id="copyLogs" title="Copy to Clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="console-btn danger" id="clearLogs" title="Clear Console">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="console-btn" id="closeConsole" title="Close Console">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="console-body" id="consoleBody"></div>
        `;
        document.body.appendChild(consoleEl);
        this.container = consoleEl;
        this.body = consoleEl.querySelector('#consoleBody');
    }

    bindEvents() {
        window.addEventListener('escriba-log', (e) => {
            this.appendLog(e.detail);
        });

        window.addEventListener('escriba-logs-cleared', () => {
            this.body.innerHTML = '';
        });

        this.container.querySelector('#closeConsole').addEventListener('click', () => this.toggle(false));
        this.container.querySelector('#clearLogs').addEventListener('click', () => this.logger.clear());
        this.container.querySelector('#copyLogs').addEventListener('click', () => this.copyToClipboard());

        this.container.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFilter = btn.dataset.filter;
                this.filterLogs();
            });
        });
    }

    toggle(force) {
        this.isOpen = force !== undefined ? force : !this.isOpen;
        this.container.classList.toggle('active', this.isOpen);

        if (this.isOpen) {
            this.scrollToBottom();
        }
    }

    appendLog(entry) {
        const logEl = document.createElement('div');
        logEl.className = `log-entry log-${entry.level}`;
        logEl.dataset.level = entry.level;

        if (this.activeFilter !== 'all' && entry.level !== this.activeFilter) {
            logEl.style.display = 'none';
        }

        const time = entry.timestamp.split('T')[1].split('.')[0];

        logEl.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-level">${entry.level}</span>
            <span class="log-msg">${this.escapeHtml(entry.message)}</span>
        `;

        this.body.appendChild(logEl);

        if (this.isOpen) {
            this.scrollToBottom();
        }
    }

    renderInitialLogs() {
        const logs = this.logger.getLogs();
        logs.forEach(log => this.appendLog(log));
    }

    filterLogs() {
        const entries = this.body.querySelectorAll('.log-entry');
        entries.forEach(entry => {
            if (this.activeFilter === 'all' || entry.dataset.level === this.activeFilter) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        });
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.body.scrollTop = this.body.scrollHeight;
    }

    copyToClipboard() {
        const logs = this.logger.getLogs();
        const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            console.log('Logs copiados al portapapeles');
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
