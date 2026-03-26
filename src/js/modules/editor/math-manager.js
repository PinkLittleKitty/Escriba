export class MathManager {
    constructor(app) {
        this.app = app;
        this.toolbar = null;
        this.symbols = [
            { symbol: '∞', title: 'Infinito' },
            { symbol: '∑', title: 'Sumatoria' },
            { symbol: '∫', title: 'Integral' },
            { symbol: '∂', title: 'Derivada parcial' },
            { symbol: '√', title: 'Raíz cuadrada' },
            { symbol: 'π', title: 'Pi' },
            { symbol: 'θ', title: 'Theta' },
            { symbol: 'α', title: 'Alfa' },
            { symbol: 'β', title: 'Beta' },
            { symbol: 'λ', title: 'Lambda' },
            { symbol: 'μ', title: 'Mu' },
            { symbol: 'σ', title: 'Sigma' }
        ];
        this.operators = [
            { symbol: '±', title: 'Más/menos' },
            { symbol: '≤', title: 'Menor o igual' },
            { symbol: '≥', title: 'Mayor o igual' },
            { symbol: '≠', title: 'No igual' },
            { symbol: '≈', title: 'Aproximadamente' },
            { symbol: '∈', title: 'Pertenece a' },
            { symbol: '∀', title: 'Para todo' },
            { symbol: '∃', title: 'Existe' },
            { symbol: '∩', title: 'Intersección' },
            { symbol: '∪', title: 'Unión' }
        ];
    }

    toggle(note) {
        if (!note) return;

        note.mathMode = !note.mathMode;

        if (note.mathMode) {
            this.enable();
        } else {
            this.disable();
        }

        const mathBtn = document.getElementById('mathModeBtn');
        if (mathBtn) {
            mathBtn.classList.toggle('active', note.mathMode);
        }
    }

    enable() {
        const noteContent = document.getElementById('noteContent');
        if (noteContent) {
            noteContent.classList.add('math-mode');
        }

        if (!this.toolbar) {
            this.createToolbar();
        }

        if (this.toolbar) {
            this.toolbar.style.display = 'flex';
        }
    }

    disable() {
        const noteContent = document.getElementById('noteContent');
        if (noteContent) {
            noteContent.classList.remove('math-mode');
        }

        if (this.toolbar) {
            this.toolbar.style.display = 'none';
        }
    }

    sync(note) {
        if (note && note.mathMode) {
            this.enable();
        } else {
            this.disable();
        }

        const mathBtn = document.getElementById('mathModeBtn');
        if (mathBtn) {
            mathBtn.classList.toggle('active', !!(note && note.mathMode));
        }
    }

    createToolbar() {
        const existing = document.getElementById('mathToolbar');
        if (existing) {
            this.toolbar = existing;
            return;
        }

        const toolbar = document.createElement('div');
        toolbar.id = 'mathToolbar';
        toolbar.className = 'math-toolbar';

        let html = `
            <div class="math-toolbar-group">
                <span class="math-toolbar-label">Símbolos:</span>
                ${this.symbols.map(s => `
                    <button class="math-symbol-btn" data-symbol="${s.symbol}" title="${s.title}">${s.symbol}</button>
                `).join('')}
            </div>
            <div class="math-toolbar-group">
                <span class="math-toolbar-label">Operadores:</span>
                ${this.operators.map(s => `
                    <button class="math-symbol-btn" data-symbol="${s.symbol}" title="${s.title}">${s.symbol}</button>
                `).join('')}
            </div>
            <div class="math-toolbar-group">
                <button class="math-function-btn" data-action="fraction" title="Insertar fracción">
                    <span class="fraction-preview">a/b</span>
                </button>
                <button class="math-function-btn" data-action="equation" title="Insertar ecuación">
                    <span>f(x) =</span>
                </button>
                <button class="math-function-btn" data-action="matrix" title="Insertar matriz">
                    <span class="matrix-preview">[⋯]</span>
                </button>
            </div>
        `;

        toolbar.innerHTML = html;

        const editorToolbar = document.querySelector('.editor-toolbar');
        if (editorToolbar) {
            editorToolbar.parentNode.insertBefore(toolbar, editorToolbar.nextSibling);
        } else {
            const container = document.querySelector('.editor-container');
            if (container) container.prepend(toolbar);
        }

        this.toolbar = toolbar;
        this.bindEvents();
    }

    bindEvents() {
        this.toolbar.querySelectorAll('.math-symbol-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.insertSymbol(e.currentTarget.dataset.symbol);
            });
        });

        this.toolbar.querySelectorAll('.math-function-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.insertFunction(e.currentTarget.dataset.action);
            });
        });
    }

    insertSymbol(symbol) {
        const noteContent = document.getElementById('noteContent');
        if (!noteContent) return;

        if (document.activeElement !== noteContent && !noteContent.contains(document.activeElement)) {
            noteContent.focus();
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (noteContent.contains(range.commonAncestorContainer)) {
                const symbolNode = document.createTextNode(symbol);
                range.insertNode(symbolNode);
                range.setStartAfter(symbolNode);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);

                if (this.app && this.app.debouncedSave) {
                    this.app.debouncedSave();
                }
                return;
            }
        }

        document.execCommand('insertText', false, symbol);
    }

    insertFunction(action) {
        const noteContent = document.getElementById('noteContent');
        if (!noteContent) return;

        if (document.activeElement !== noteContent && !noteContent.contains(document.activeElement)) {
            noteContent.focus();
        }

        let template = '';
        let cursorOffset = 0;

        switch (action) {
            case 'fraction':
                template = ' a/b ';
                cursorOffset = 1;
                break;
            case 'equation':
                template = ' f(x) = ';
                cursorOffset = 0;
                break;
            case 'matrix':
                template = '\n\n[a₁₁  a₁₂]\n[a₂₁  a₂₂]\n\n';
                cursorOffset = 3;
                break;
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (noteContent.contains(range.commonAncestorContainer)) {
                const templateNode = document.createTextNode(template);
                range.insertNode(templateNode);

                if (cursorOffset > 0) {
                    range.setStart(templateNode, cursorOffset);
                    range.setEnd(templateNode, cursorOffset + 1);
                } else {
                    range.setStartAfter(templateNode);
                    range.collapse(true);
                }

                selection.removeAllRanges();
                selection.addRange(range);

                if (this.app && this.app.debouncedSave) {
                    this.app.debouncedSave();
                }
                return;
            }
        }

        document.execCommand('insertText', false, template);
    }
}
