class CuadernoDigital {
    constructor() {
        this.subjects = JSON.parse(localStorage.getItem('cuadernoDigital')) || [];
        this.currentNoteId = null;
        this.currentView = 'subjects';
        this.selectedColor = '#3b82f6';
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        document.body.classList.add('loading');

        this.bindEvents();
        this.loadSettings();
        this.renderSubjects();

        if (this.subjects.length === 0) {
            this.showWelcomeScreen();
        }

        this.updateSemesterInfo();

        setTimeout(() => {
            document.body.classList.remove('loading');
        }, 100);
    }

    bindEvents() {
        document.getElementById('newSubjectBtn').addEventListener('click', () => this.showSubjectModal());
        document.getElementById('newNoteBtn').addEventListener('click', () => this.createNewNote());
        document.getElementById('welcomeNewSubject').addEventListener('click', () => this.showSubjectModal());

        document.querySelector('.dropdown-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.dropdown').classList.toggle('active');
        });

        document.addEventListener('click', () => {
            document.querySelector('.dropdown').classList.remove('active');
        });

        document.getElementById('exportBtn').addEventListener('click', () => this.exportCarpeta());
        document.getElementById('importBtn').addEventListener('click', () => this.importCarpeta());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettingsModal());
        document.getElementById('printBtn').addEventListener('click', () => this.printCurrentNote());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.closest('.view-btn').dataset.view));
        });

        document.getElementById('searchInput').addEventListener('input', (e) => this.searchContent(e.target.value));

        document.getElementById('createSubject').addEventListener('click', () => this.createSubject());
        document.getElementById('cancelSubject').addEventListener('click', () => this.hideSubjectModal());
        document.querySelector('.modal-close').addEventListener('click', () => this.hideSubjectModal());

        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('cancelSettings').addEventListener('click', () => this.hideSettingsModal());
        document.getElementById('clearAllData').addEventListener('click', () => this.clearAllData());
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());

        document.querySelectorAll('#settingsModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideSettingsModal());
        });

        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
        });

        document.getElementById('noteTitle').addEventListener('input', () => this.debouncedSave());
        document.getElementById('noteContent').addEventListener('input', () => this.debouncedSave());
        document.getElementById('noteTypeSelect').addEventListener('change', () => this.saveCurrentNote());
        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());

        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.target.closest('.toolbar-btn').dataset.command;
                if (command) {
                    this.formatText(command);
                }
            });
        });

        document.getElementById('highlightBtn').addEventListener('click', () => this.highlightText());
        document.getElementById('insertDateBtn').addEventListener('click', () => this.insertDate());

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        this.autoSaveInterval = setInterval(() => {
            if (this.currentNoteId) {
                this.saveCurrentNote(true);
            }
        }, 2000);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSubjectModal();
                this.hideSettingsModal();
            }
        });

        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectTheme(e.target.closest('.theme-option').dataset.theme));
        });

        document.getElementById('fontSize').addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
            document.documentElement.style.setProperty('--font-size', e.target.value + 'px');
        });

        document.getElementById('fontFamily').addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--font-family', e.target.value);
        });
    }

    updateSemesterInfo() {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        let semester;
        if (month >= 2 && month <= 6) {
            semester = `1er Cuatrimestre ${year}`;
        } else if (month >= 7 && month <= 11) {
            semester = `2do Cuatrimestre ${year}`;
        } else {
            semester = `Verano ${year}`;
        }

        document.getElementById('currentSemester').textContent = semester;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');

        messageEl.textContent = message;
        toast.className = `toast ${type}`;

        if (type === 'success') {
            icon.className = 'toast-icon fas fa-check-circle';
        } else if (type === 'error') {
            icon.className = 'toast-icon fas fa-exclamation-circle';
        } else if (type === 'info') {
            icon.className = 'toast-icon fas fa-info-circle';
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    debouncedSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, 500);
    }

    showSubjectModal() {
        document.getElementById('subjectModal').classList.add('active');
        document.getElementById('subjectName').focus();
        this.selectedColor = '#3b82f6';
        this.updateColorSelection();
    }

    hideSubjectModal() {
        document.getElementById('subjectModal').classList.remove('active');
        document.getElementById('subjectName').value = '';
        document.getElementById('subjectCode').value = '';
        document.getElementById('subjectProfessor').value = '';
        this.selectedColor = '#3b82f6';
        this.updateColorSelection();
    }

    selectColor(color) {
        this.selectedColor = color;
        this.updateColorSelection();
    }

    updateColorSelection() {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.color === this.selectedColor);
        });
    }

    createSubject() {
        const name = document.getElementById('subjectName').value.trim();
        const code = document.getElementById('subjectCode').value.trim();
        const professor = document.getElementById('subjectProfessor').value.trim();

        if (!name) {
            this.showToast('Por favor ingresá el nombre de la materia', 'error');
            return;
        }

        const subject = {
            id: Date.now().toString(),
            name: name,
            code: code,
            professor: professor,
            color: this.selectedColor,
            notes: [],
            createdAt: new Date().toISOString(),
            expanded: true
        };

        this.subjects.unshift(subject);
        this.saveCarpeta();
        this.renderSubjects();
        this.hideSubjectModal();
        this.showToast(`Materia "${name}" creada exitosamente`, 'success');

        if (this.subjects.length === 1) {
            this.showWelcomeScreen(false);
        }
    }

    createNewNote() {
        if (this.subjects.length === 0) {
            this.showToast('Primero creá una materia', 'info');
            this.showSubjectModal();
            return;
        }

        const subjectId = this.getCurrentSubjectId() || this.subjects[0].id;
        const subject = this.subjects.find(s => s.id === subjectId);

        const note = {
            id: Date.now().toString(),
            title: 'Apunte sin título',
            content: '',
            type: 'lecture',
            subjectId: subjectId,
            favorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        subject.notes.unshift(note);
        this.saveCarpeta();
        this.renderSubjects();
        this.openNote(note.id);
        this.showToast('Nuevo apunte creado', 'success');
    }

    getCurrentSubjectId() {
        if (this.currentNoteId) {
            for (const subject of this.subjects) {
                const note = subject.notes.find(n => n.id === this.currentNoteId);
                if (note) return subject.id;
            }
        }
        return null;
    }

    openNote(noteId) {
        let note = null;
        let subject = null;

        for (const s of this.subjects) {
            const foundNote = s.notes.find(n => n.id === noteId);
            if (foundNote) {
                note = foundNote;
                subject = s;
                break;
            }
        }

        if (!note || !subject) return;

        this.currentNoteId = noteId;

        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('noteEditor').style.display = 'flex';

        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').innerHTML = note.content;
        document.getElementById('noteTypeSelect').value = note.type || 'lecture';
        document.getElementById('noteDate').textContent = this.formatDate(note.updatedAt);

        document.getElementById('noteSubject').textContent = subject.name;
        document.getElementById('noteType').textContent = this.getNoteTypeLabel(note.type || 'lecture');

        const favoriteBtn = document.getElementById('favoriteBtn');
        favoriteBtn.classList.toggle('active', note.favorite || false);

        document.querySelectorAll('.note-item, .note-item-compact').forEach(item => {
            item.classList.toggle('active', item.dataset.noteId === noteId);
        });

        setTimeout(() => {
            document.getElementById('noteContent').focus();
        }, 100);
    }

    getNoteTypeLabel(type) {
        const types = {
            lecture: '📝 Apuntes de Clase',
            assignment: '📋 Trabajo Práctico',
            study: '📚 Guía de Estudio',
            lab: '🧪 Informe de Lab',
            project: '🚀 Proyecto',
            exam: '📊 Preparación Parcial',
            summary: '📄 Resumen',
            exercise: '✏️ Ejercicios'
        };
        return types[type] || '📝 Apuntes de Clase';
    }

    toggleFavorite() {
        if (!this.currentNoteId) return;

        let note = null;
        for (const subject of this.subjects) {
            const foundNote = subject.notes.find(n => n.id === this.currentNoteId);
            if (foundNote) {
                note = foundNote;
                break;
            }
        }

        if (!note) return;

        note.favorite = !note.favorite;
        this.saveCarpeta();
        this.renderSubjects();

        const favoriteBtn = document.getElementById('favoriteBtn');
        favoriteBtn.classList.toggle('active', note.favorite);

        const message = note.favorite ? 'Apunte agregado a favoritos' : 'Apunte removido de favoritos';
        this.showToast(message, 'success');
    }

    insertDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const content = document.getElementById('noteContent');
        const selection = window.getSelection();

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const dateElement = document.createElement('strong');
            dateElement.textContent = dateStr;
            range.insertNode(dateElement);
            range.collapse(false);
        }

        this.saveCurrentNote();
    }

    printCurrentNote() {
        if (!this.currentNoteId) {
            this.showToast('No hay ningún apunte abierto para imprimir', 'error');
            return;
        }

        window.print();
    }

    saveCurrentNote(isAutoSave = false) {
        if (!this.currentNoteId) return;

        let note = null;
        let subject = null;

        for (const s of this.subjects) {
            const foundNote = s.notes.find(n => n.id === this.currentNoteId);
            if (foundNote) {
                note = foundNote;
                subject = s;
                break;
            }
        }

        if (!note) return;

        const title = document.getElementById('noteTitle').value.trim() || 'Apunte sin título';
        const content = document.getElementById('noteContent').innerHTML;
        const type = document.getElementById('noteTypeSelect').value;

        const hasChanges = note.title !== title || note.content !== content || note.type !== type;
        if (!hasChanges && isAutoSave) return;

        note.title = title;
        note.content = content;
        note.type = type;
        note.updatedAt = new Date().toISOString();

        this.saveCarpeta();
        this.renderSubjects();
        document.getElementById('noteDate').textContent = this.formatDate(note.updatedAt);
        document.getElementById('noteType').textContent = this.getNoteTypeLabel(type);

        if (!isAutoSave) {
            this.showToast('Apunte guardado', 'success');
        }
    }

    deleteCurrentNote() {
        if (!this.currentNoteId) return;

        if (confirm('¿Estás seguro de que querés eliminar este apunte? Esta acción no se puede deshacer.')) {
            let noteTitle = '';

            for (const subject of this.subjects) {
                const noteIndex = subject.notes.findIndex(n => n.id === this.currentNoteId);
                if (noteIndex !== -1) {
                    noteTitle = subject.notes[noteIndex].title;
                    subject.notes.splice(noteIndex, 1);
                    break;
                }
            }

            this.saveCarpeta();
            this.renderSubjects();
            this.showWelcomeScreen();
            this.currentNoteId = null;
            this.showToast(`Apunte "${noteTitle}" eliminado`, 'success');
        }
    }

    renderSubjects() {
        const container = document.getElementById('subjectsContainer');

        if (this.subjects.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Todavía no tenés materias</div>';
            return;
        }

        if (this.currentView === 'recent') {
            this.renderRecentNotes();
            return;
        }

        if (this.currentView === 'favorites') {
            this.renderFavoriteNotes();
            return;
        }

        container.innerHTML = this.subjects.map(subject => `
            <div class="subject-folder ${subject.expanded ? 'expanded' : ''}" data-subject-id="${subject.id}">
                <div class="subject-header">
                    <div class="subject-info">
                        <div class="subject-icon" style="background: ${subject.color}"></div>
                        <div class="subject-details">
                            <span class="subject-name">${this.escapeHtml(subject.name)}</span>
                            ${subject.code ? `<span class="subject-code">${this.escapeHtml(subject.code)}</span>` : ''}
                            ${subject.professor ? `<span class="subject-professor">Prof. ${this.escapeHtml(subject.professor)}</span>` : ''}
                        </div>
                        <span class="subject-count">${subject.notes.length}</span>
                    </div>
                    <i class="fas fa-chevron-right subject-toggle"></i>
                </div>
                <div class="notes-list">
                    ${subject.notes.length === 0 ?
                '<div class="empty-subject">No hay apuntes todavía</div>' :
                subject.notes.map(note => `
                            <div class="note-item ${note.favorite ? 'favorite' : ''}" data-note-id="${note.id}">
                                <div class="note-type-icon">${this.getNoteTypeIcon(note.type)}</div>
                                <div class="note-details">
                                    <h3>
                                        ${this.escapeHtml(note.title)}
                                        ${note.favorite ? '<i class="fas fa-star favorite-star"></i>' : ''}
                                    </h3>
                                    <p>${this.getPreview(note.content)}</p>
                                    <div class="note-date">${this.formatDate(note.updatedAt)}</div>
                                </div>
                            </div>
                        `).join('')
            }
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.subject-header').forEach(header => {
            header.addEventListener('click', () => {
                const folder = header.closest('.subject-folder');
                folder.classList.toggle('expanded');
                const subjectId = folder.dataset.subjectId;
                const subject = this.subjects.find(s => s.id === subjectId);
                if (subject) {
                    subject.expanded = folder.classList.contains('expanded');
                    this.saveCarpeta();
                }
            });
        });

        container.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => this.openNote(item.dataset.noteId));
        });
    }

    renderFavoriteNotes() {
        const container = document.getElementById('subjectsContainer');

        const favoriteNotes = [];
        this.subjects.forEach(subject => {
            subject.notes.forEach(note => {
                if (note.favorite) {
                    favoriteNotes.push({
                        ...note,
                        subjectName: subject.name,
                        subjectColor: subject.color
                    });
                }
            });
        });

        favoriteNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        if (favoriteNotes.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No tenés apuntes favoritos todavía</div>';
            return;
        }

        container.innerHTML = `
            <div class="favorites-section">
                <div class="section-header">
                    <i class="fas fa-star"></i>
                    <span>Apuntes Favoritos (${favoriteNotes.length})</span>
                </div>
                <div class="favorites-content">
                    ${favoriteNotes.map(note => `
                        <div class="note-item-compact favorite" data-note-id="${note.id}">
                            <div class="compact-note-header">
                                <div class="note-type-icon" data-tooltip="${this.escapeHtml(note.title)}">${this.getNoteTypeIcon(note.type)}</div>
                                <div class="note-title-compact">${this.escapeHtml(note.title)}</div>
                                <i class="fas fa-star favorite-star"></i>
                                <button class="expand-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.classList.toggle('expanded')">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <div class="note-details-expanded">
                                <p class="note-preview">${this.getPreview(note.content)}</p>
                                <div class="note-meta-row">
                                    <span class="note-subject" style="color: ${note.subjectColor}">${note.subjectName}</span>
                                    <span class="note-date">${this.formatDate(note.updatedAt)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.note-item-compact').forEach(item => {
            item.addEventListener('click', () => this.openNote(item.dataset.noteId));
        });
    }

    renderRecentNotes() {
        const container = document.getElementById('subjectsContainer');

        const allNotes = [];
        this.subjects.forEach(subject => {
            subject.notes.forEach(note => {
                allNotes.push({
                    ...note,
                    subjectName: subject.name,
                    subjectColor: subject.color
                });
            });
        });

        allNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const recentNotes = allNotes.slice(0, 20);

        if (recentNotes.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No hay apuntes recientes</div>';
            return;
        }

        container.innerHTML = `
            <div class="recent-notes">
                <div class="section-header">
                    <i class="fas fa-clock"></i>
                    <span>Apuntes Recientes</span>
                </div>
                <div class="recent-content">
                    ${recentNotes.map(note => `
                        <div class="note-item-compact ${note.favorite ? 'favorite' : ''}" data-note-id="${note.id}">
                            <div class="compact-note-header">
                                <div class="note-type-icon" data-tooltip="${this.escapeHtml(note.title)}">${this.getNoteTypeIcon(note.type)}</div>
                                <div class="note-title-compact">${this.escapeHtml(note.title)}</div>
                                ${note.favorite ? '<i class="fas fa-star favorite-star"></i>' : ''}
                                <button class="expand-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.classList.toggle('expanded')">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <div class="note-details-expanded">
                                <p class="note-preview">${this.getPreview(note.content)}</p>
                                <div class="note-meta-row">
                                    <span class="note-subject" style="color: ${note.subjectColor}">${note.subjectName}</span>
                                    <span class="note-date">${this.formatDate(note.updatedAt)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.note-item-compact').forEach(item => {
            item.addEventListener('click', () => this.openNote(item.dataset.noteId));
        });
    }

    getNoteTypeIcon(type) {
        const icons = {
            lecture: '📝',
            assignment: '📋',
            study: '📚',
            lab: '🧪',
            project: '🚀',
            exam: '📊',
            summary: '📄',
            exercise: '✏️'
        };
        return icons[type] || '📝';
    }

    switchView(view) {
        this.currentView = view;

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.renderSubjects();
    }

    searchContent(query) {
        if (!query.trim()) {
            this.renderSubjects();
            return;
        }

        const container = document.getElementById('subjectsContainer');
        const results = [];

        this.subjects.forEach(subject => {
            subject.notes.forEach(note => {
                if (note.title.toLowerCase().includes(query.toLowerCase()) ||
                    note.content.toLowerCase().includes(query.toLowerCase()) ||
                    subject.name.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        ...note,
                        subjectName: subject.name,
                        subjectColor: subject.color
                    });
                }
            });
        });

        if (results.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No se encontraron resultados</div>';
            return;
        }

        const resultText = results.length === 1 ? '1 resultado' : `${results.length} resultados`;

        container.innerHTML = `
            <div class="search-results">
                <div class="section-header">
                    <i class="fas fa-search"></i>
                    <span>Búsqueda: "${query}" (${resultText})</span>
                </div>
                <div class="search-content">
                    ${results.map(note => `
                        <div class="note-item-compact ${note.favorite ? 'favorite' : ''}" data-note-id="${note.id}">
                            <div class="compact-note-header">
                                <div class="note-type-icon" data-tooltip="${this.escapeHtml(note.title)}">${this.getNoteTypeIcon(note.type)}</div>
                                <div class="note-title-compact">${this.highlightSearchTerm(this.escapeHtml(note.title), query)}</div>
                                ${note.favorite ? '<i class="fas fa-star favorite-star"></i>' : ''}
                                <button class="expand-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.classList.toggle('expanded')">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <div class="note-details-expanded">
                                <p class="note-preview">${this.highlightSearchTerm(this.getPreview(note.content), query)}</p>
                                <div class="note-meta-row">
                                    <span class="note-subject" style="color: ${note.subjectColor}">${note.subjectName}</span>
                                    <span class="note-date">${this.formatDate(note.updatedAt)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.note-item-compact').forEach(item => {
            item.addEventListener('click', () => this.openNote(item.dataset.noteId));
        });
    }

    highlightSearchTerm(text, term) {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    formatText(command) {
        document.execCommand(command, false, null);
        document.getElementById('noteContent').focus();

        this.updateToolbarStates();
        this.saveCurrentNote();
    }

    highlightText() {
        document.execCommand('backgroundColor', false, '#fbbf24');
        document.getElementById('noteContent').focus();
        this.saveCurrentNote();
    }

    updateToolbarStates() {
        const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
        commands.forEach(command => {
            const btn = document.querySelector(`[data-command="${command}"]`);
            if (btn) {
                btn.classList.toggle('active', document.queryCommandState(command));
            }
        });
    }

    handleKeyboardShortcuts(e) {
        if (!document.getElementById('noteContent').contains(document.activeElement)) return;

        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    this.formatText('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.formatText('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    this.formatText('underline');
                    break;
                case 's':
                    e.preventDefault();
                    this.saveCurrentNote();
                    break;
            }
        }
    }

    exportCarpeta() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            subjects: this.subjects
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cuaderno-digital-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showToast('Carpeta exportada exitosamente', 'success');
    }

    importCarpeta() {
        document.getElementById('importFile').click();
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                let subjects = [];

                if (importedData.subjects && Array.isArray(importedData.subjects)) {
                    subjects = importedData.subjects;
                } else if (Array.isArray(importedData)) {
                    subjects = importedData;
                } else {
                    throw new Error('Formato inválido');
                }

                if (confirm('Esto va a reemplazar toda tu carpeta. ¿Querés continuar?')) {
                    this.subjects = subjects;
                    this.saveCarpeta();
                    this.renderSubjects();
                    this.showWelcomeScreen();
                    this.currentNoteId = null;
                    this.showToast('Carpeta importada exitosamente', 'success');
                }
            } catch (error) {
                this.showToast('Archivo inválido. Por favor seleccioná un archivo de respaldo válido.', 'error');
            }
        };
        reader.readAsText(file);

        event.target.value = '';
    }

    showWelcomeScreen(show = true) {
        if (show && this.subjects.length === 0) {
            document.getElementById('welcomeScreen').style.display = 'flex';
            document.getElementById('noteEditor').style.display = 'none';
        } else {
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('noteEditor').style.display = 'none';
        }
    }

    saveCarpeta() {
        localStorage.setItem('cuadernoDigital', JSON.stringify(this.subjects));
    }

    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('active');
            this.updateSettingsStats();
            this.loadCurrentSettings();
        } else {
            console.error('Settings modal not found');
        }
    }

    hideSettingsModal() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('escribaSettings')) || {};

        if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        if (settings.fontFamily) {
            document.documentElement.style.setProperty('--font-family', settings.fontFamily);
        }

        if (settings.fontSize) {
            document.documentElement.style.setProperty('--font-size', settings.fontSize + 'px');
        }

        if (settings.autoSave !== undefined) {
            if (!settings.autoSave && this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
        }
    }

    loadCurrentSettings() {
        const settings = JSON.parse(localStorage.getItem('escribaSettings')) || {
            theme: 'dark',
            fontFamily: 'Inter',
            fontSize: 16,
            autoSave: true,
            expandSubjects: true,
            showWelcome: true
        };

        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === settings.theme);
        });

        const fontFamilyEl = document.getElementById('fontFamily');
        const fontSizeEl = document.getElementById('fontSize');
        const fontSizeValueEl = document.getElementById('fontSizeValue');
        const autoSaveEl = document.getElementById('autoSave');
        const expandSubjectsEl = document.getElementById('expandSubjects');
        const showWelcomeEl = document.getElementById('showWelcome');

        if (fontFamilyEl) fontFamilyEl.value = settings.fontFamily;
        if (fontSizeEl) fontSizeEl.value = settings.fontSize;
        if (fontSizeValueEl) fontSizeValueEl.textContent = settings.fontSize + 'px';
        if (autoSaveEl) autoSaveEl.checked = settings.autoSave;
        if (expandSubjectsEl) expandSubjectsEl.checked = settings.expandSubjects;
        if (showWelcomeEl) showWelcomeEl.checked = settings.showWelcome;
    }

    selectTheme(theme) {
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === theme);
        });
        document.documentElement.setAttribute('data-theme', theme);
    }

    saveSettings() {
        const activeTheme = document.querySelector('.theme-option.active');
        const fontFamilyEl = document.getElementById('fontFamily');
        const fontSizeEl = document.getElementById('fontSize');
        const autoSaveEl = document.getElementById('autoSave');
        const expandSubjectsEl = document.getElementById('expandSubjects');
        const showWelcomeEl = document.getElementById('showWelcome');

        if (!activeTheme || !fontFamilyEl || !fontSizeEl || !autoSaveEl || !expandSubjectsEl || !showWelcomeEl) {
            console.error('Settings form elements not found');
            return;
        }

        const settings = {
            theme: activeTheme.dataset.theme,
            fontFamily: fontFamilyEl.value,
            fontSize: parseInt(fontSizeEl.value),
            autoSave: autoSaveEl.checked,
            expandSubjects: expandSubjectsEl.checked,
            showWelcome: showWelcomeEl.checked
        };

        localStorage.setItem('escribaSettings', JSON.stringify(settings));

        document.documentElement.setAttribute('data-theme', settings.theme);
        document.documentElement.style.setProperty('--font-family', settings.fontFamily);
        document.documentElement.style.setProperty('--font-size', settings.fontSize + 'px');

        if (settings.autoSave && !this.autoSaveInterval) {
            this.autoSaveInterval = setInterval(() => {
                if (this.currentNoteId) {
                    this.saveCurrentNote(true);
                }
            }, 2000);
        } else if (!settings.autoSave && this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        if (settings.expandSubjects) {
            this.subjects.forEach(subject => {
                subject.expanded = true;
            });
            this.saveCarpeta();
            this.renderSubjects();
        }

        this.hideSettingsModal();
        this.showToast('Configuración guardada exitosamente', 'success');
    }

    updateSettingsStats() {
        const totalSubjects = this.subjects.length;
        const totalNotes = this.subjects.reduce((sum, subject) => sum + subject.notes.length, 0);
        const totalWords = this.subjects.reduce((sum, subject) => {
            return sum + subject.notes.reduce((noteSum, note) => {
                const text = note.content.replace(/<[^>]*>/g, '').trim();
                return noteSum + (text ? text.split(/\s+/).length : 0);
            }, 0);
        }, 0);

        document.getElementById('totalSubjects').textContent = totalSubjects;
        document.getElementById('totalNotes').textContent = totalNotes;
        document.getElementById('totalWords').textContent = totalWords.toLocaleString();
    }

    clearAllData() {
        if (confirm('¿Estás seguro de que querés eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            if (confirm('Esta acción eliminará todas tus materias y apuntes permanentemente. ¿Estás completamente seguro?')) {
                localStorage.removeItem('cuadernoDigital');
                this.subjects = [];
                this.currentNoteId = null;
                this.renderSubjects();
                this.showWelcomeScreen();
                this.hideSettingsModal();
                this.showToast('Todos los datos han sido eliminados', 'success');
            }
        }
    }

    resetSettings() {
        if (confirm('¿Querés restaurar la configuración por defecto?')) {
            localStorage.removeItem('escribaSettings');

            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.style.removeProperty('--font-family');
            document.documentElement.style.removeProperty('--font-size');

            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
            }
            this.autoSaveInterval = setInterval(() => {
                if (this.currentNoteId) {
                    this.saveCurrentNote(true);
                }
            }, 2000);

            this.loadCurrentSettings();
            this.showToast('Configuración restaurada', 'success');
        }
    }

    getPreview(content) {
        const text = content.replace(/<[^>]*>/g, '').trim();
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Hoy';
        } else if (diffDays === 2) {
            return 'Ayer';
        } else if (diffDays <= 7) {
            return `Hace ${diffDays - 1} día${diffDays - 1 !== 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CuadernoDigital();
});