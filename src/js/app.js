import {
    validateAndCleanSubjects,
    validateAndCleanEvents,
    loadAllData,
    saveSubjects,
    saveEvents,
    saveSettings
} from './modules/storage.js';
import {
    formatDate,
    generateId,
    debounce,
    escapeHtml,
    sanitizeText
} from './utils/helpers.js';
import {
    initializeAceEditor,
    updateEditorHeight
} from './modules/editor/editor-manager.js';
import {
    renderUMLDiagram,
    updateUMLPreview,
    detectDiagramType,
    getDiagramTypeName
} from './modules/editor/uml-manager.js';
import { GitHubManager } from './modules/github/github-manager.js';
import {
    renderRecentNotes,
    renderFavoriteNotes,
    updateSemesterInfo
} from './ui/sidebar-ui.js';
import {
    renderCalendarGrid,
    updateCalendarHeader
} from './ui/calendar-ui.js';
import {
    showToast,
    showModal,
    hideModal,
    initModalEvents
} from './ui/modal-ui.js';
import {
    updateToolbarStates,
    updateLanguageSelectVisibility,
    showWelcomeScreen
} from './ui/editor-ui.js';
import {
    applySettings,
    loadSettingsToModal,
    getCurrentSettings
} from './modules/settings.js';

class EscribaApp {
    constructor() {
        const data = loadAllData();
        this.subjects = data.subjects;
        this.events = data.events;
        this.settings = data.settings || applySettings();

        this.currentNoteId = null;
        this.currentView = 'subjects';
        this.selectedColor = '#3b82f6';
        this.autoSaveInterval = null;
        this.currentDate = new Date();
        this.currentEventId = null;

        this.github = new GitHubManager({
            onStatusChange: (status, error) => this.handleGitHubStatusChange(status, error),
            showToast: (msg, type) => showToast(msg, type)
        });

        this.debouncedSave = debounce(() => this.saveCurrentNote(), 500);
    }

    async init() {
        document.body.classList.add('loading');

        this.bindEvents();
        applySettings();
        this.loadSidebarState();
        this.initMermaid();

        updateSemesterInfo(document.getElementById('currentSemester'));
        this.renderSubjects();

        if (this.subjects.length === 0) {
            showWelcomeScreen(true);
        }

        this.switchView('subjects');

        setTimeout(() => {
            document.body.classList.remove('loading');
        }, 100);
    }

    initMermaid() {
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: false,
                theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark',
                securityLevel: 'loose',
                fontFamily: 'Inter, Arial, sans-serif'
            });
        }
    }

    bindEvents() {
        document.getElementById('newSubjectBtn').addEventListener('click', () => showModal('subjectModal'));
        document.getElementById('newNoteBtn').addEventListener('click', () => this.createNewNote());
        document.getElementById('welcomeNewSubject').addEventListener('click', () => showModal('subjectModal'));
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());

        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        const mobileOverlay = document.getElementById('mobileOverlay');
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => this.toggleSidebar());
        }

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.closest('.view-btn').dataset.view));
        });

        document.getElementById('searchInput').addEventListener('input', (e) => this.searchContent(e.target.value));

        const dropdownToggle = document.querySelector('.dropdown-toggle');
        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelector('.dropdown').classList.toggle('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-menu')) {
                const dropdown = document.querySelector('.dropdown');
                if (dropdown) dropdown.classList.remove('active');
            }
        });

        document.getElementById('exportBtn').addEventListener('click', () => this.exportCarpeta());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importJsonBtn').addEventListener('click', () => document.getElementById('importJsonFile').click());
        document.getElementById('printBtn').addEventListener('click', () => window.print());

        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));
        document.getElementById('importJsonFile').addEventListener('change', (e) => this.handleJsonImport(e));

        document.getElementById('settingsBtn').addEventListener('click', () => {
            loadSettingsToModal(this.settings);
            showModal('settingsModal');
        });

        initModalEvents((modalId) => {
            if (modalId === 'subjectModal') {
                document.getElementById('subjectName').value = '';
                document.getElementById('subjectCode').value = '';
                document.getElementById('subjectProfessor').value = '';
            }
        });

        document.getElementById('createSubject').addEventListener('click', () => this.createSubject());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('clearAllData').addEventListener('click', () => {
            if (confirm('¿Estás seguro de que querés borrar todos tus datos? Esta acción es irreversible.')) {
                localStorage.clear();
                window.location.reload();
            }
        });

        document.getElementById('noteTitle').addEventListener('input', () => this.debouncedSave());
        document.getElementById('noteContent').addEventListener('input', () => {
            updateToolbarStates();
            this.debouncedSave();
        });

        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('shareNoteBtn').addEventListener('click', () => showModal('shareModal'));

        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.target.closest('.toolbar-btn').dataset.command;
                if (command) {
                    document.execCommand(command, false, null);
                    updateToolbarStates();
                }
            });
        });

        document.getElementById('highlightBtn').addEventListener('click', () => document.execCommand('backColor', false, '#ffff00'));
        document.getElementById('inlineCodeBtn').addEventListener('click', () => this.toggleInlineCode());
        document.getElementById('insertCodeBtn').addEventListener('click', () => this.insertCodeBlock());
        document.getElementById('insertLinkBtn').addEventListener('click', () => showModal('linkModal'));
        document.getElementById('mathModeBtn').addEventListener('click', () => this.toggleMathMode());
        document.getElementById('insertUMLBtn').addEventListener('click', () => showModal('umlModal'));

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        const githubStatus = document.getElementById('githubStatus');
        if (githubStatus) githubStatus.addEventListener('click', () => this.handleGitHubAuth());

        const settingsSyncButton = document.getElementById('settingsSyncButton');
        if (settingsSyncButton) settingsSyncButton.addEventListener('click', () => this.handleGitHubAuth());

        const pullButton = document.getElementById('pullButton');
        if (pullButton) pullButton.addEventListener('click', () => this.handleForcePull());

        const pushButton = document.getElementById('pushButton');
        if (pushButton) pushButton.addEventListener('click', () => this.handleForcePush());

        const disconnectGitHub = document.getElementById('disconnectGitHub') || document.getElementById('disconnectButton');
        if (disconnectGitHub) disconnectGitHub.addEventListener('click', () => this.disconnectGitHub());

        document.getElementById('cancelShare').addEventListener('click', () => hideModal('shareModal'));
        document.getElementById('copyUrlBtn').addEventListener('click', () => this.copyShareUrl());
        document.getElementById('shareWhatsApp').addEventListener('click', () => this.shareToWhatsApp());
        document.getElementById('shareEmail').addEventListener('click', () => this.shareToEmail());
        document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportCurrentNoteAsJson());

        document.getElementById('addEventBtn').addEventListener('click', () => {
            this.currentEventId = null;
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventDesc').value = '';
            showModal('eventModal');
        });
        document.getElementById('saveEvent').addEventListener('click', () => this.saveEvent());
        document.getElementById('cancelEvent').addEventListener('click', () => hideModal('eventModal'));
        document.getElementById('deleteEvent').addEventListener('click', () => this.deleteEvent());
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        const createLink = document.getElementById('createLink');
        if (createLink) createLink.addEventListener('click', () => this.createInternalLink());

        const cancelLink = document.getElementById('cancelLink');
        if (cancelLink) cancelLink.addEventListener('click', () => hideModal('linkModal'));

        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectTheme(e.target.closest('.theme-option').dataset.theme));
        });

        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
        });

        document.getElementById('fontSize').addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
            document.documentElement.style.setProperty('--font-size', e.target.value + 'px');
        });

        document.getElementById('fontFamily').addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--font-family', e.target.value);
        });
    }

    createNewNote() {
        if (this.subjects.length === 0) {
            showToast('Primero debés crear una materia', 'info');
            showModal('subjectModal');
            return;
        }

        if (this.subjects.length === 1) {
            this.addNoteToSubject(this.subjects[0].id);
        } else {
            this.renderSubjectPicker();
            showModal('subjectPickerModal');
        }
    }

    renderSubjectPicker() {
        const list = document.getElementById('subjectPickerList');
        if (!list) return;

        list.innerHTML = this.subjects.map(s => `
            <div class="subject-picker-item" data-subject-id="${s.id}">
                <div class="subject-icon" style="background: ${s.color}"></div>
                <span>${escapeHtml(s.name)}</span>
            </div>
        `).join('');

        list.querySelectorAll('.subject-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                this.addNoteToSubject(item.dataset.subjectId);
                hideModal('subjectPickerModal');
            });
        });
    }

    addNoteToSubject(subjectId) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        const newNote = {
            id: generateId(),
            title: 'Nuevo apunte',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            favorite: false,
            type: 'lecture'
        };

        subject.notes.unshift(newNote);
        saveSubjects(this.subjects);
        this.renderSubjects();
        this.loadNote(newNote.id);

        showWelcomeScreen(false);
        document.getElementById('noteEditor').style.display = 'flex';
        showToast('Nuevo apunte creado', 'success');
    }

    loadNote(noteId) {
        let foundNote = null;
        let foundSubject = null;

        this.subjects.forEach(s => {
            const note = s.notes.find(n => n.id === noteId);
            if (note) {
                foundNote = note;
                foundSubject = s;
            }
        });

        if (!foundNote) return;

        this.currentNoteId = noteId;

        document.getElementById('noteTitle').value = foundNote.title;
        document.getElementById('noteContent').innerHTML = foundNote.content;
        document.getElementById('noteSubject').textContent = foundSubject.name;
        document.getElementById('noteDate').textContent = formatDate(foundNote.updatedAt);

        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('noteEditor').style.display = 'flex';

        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.toggle('active', item.dataset.noteId === noteId);
        });

        updateToolbarStates();
    }

    toggleSubject(id) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            subject.expanded = !subject.expanded;
            saveSubjects(this.subjects);
            this.renderSubjects();
        }
    }

    createSubject() {
        const name = document.getElementById('subjectName').value.trim();
        const code = document.getElementById('subjectCode').value.trim();
        const professor = document.getElementById('subjectProfessor').value.trim();

        if (!name) {
            showToast('El nombre de la materia es obligatorio', 'error');
            return;
        }

        const newSubject = {
            id: generateId(),
            name,
            code,
            professor,
            color: this.selectedColor || '#3b82f6',
            notes: [],
            expanded: true,
            createdAt: new Date().toISOString()
        };

        this.subjects.push(newSubject);
        saveSubjects(this.subjects);
        this.renderSubjects();
        hideModal('subjectModal');
        showToast('Materia creada', 'success');

        if (this.subjects.length === 1) {
            showWelcomeScreen(false);
        }
    }

    deleteCurrentNote() {
        if (!this.currentNoteId) return;
        if (!confirm('¿Estás seguro de que querés borrar este apunte?')) return;

        this.subjects.forEach(s => {
            const index = s.notes.findIndex(n => n.id === this.currentNoteId);
            if (index !== -1) {
                s.notes.splice(index, 1);
            }
        });

        this.currentNoteId = null;
        saveSubjects(this.subjects);
        this.renderSubjects();

        document.getElementById('noteEditor').style.display = 'none';
        showWelcomeScreen(true);
        showToast('Apunte eliminado', 'success');
    }

    toggleFavorite() {
        if (!this.currentNoteId) return;

        this.subjects.forEach(s => {
            const note = s.notes.find(n => n.id === this.currentNoteId);
            if (note) {
                note.favorite = !note.favorite;
                showToast(note.favorite ? 'Agregado a favoritos' : 'Eliminado de favoritos', 'info');
            }
        });

        saveSubjects(this.subjects);
        this.renderSubjects();
    }

    searchContent(query) {
        if (!query) {
            this.renderSubjects();
            return;
        }

        const filteredSubjects = JSON.parse(JSON.stringify(this.subjects));
        filteredSubjects.forEach(s => {
            s.notes = s.notes.filter(n =>
                n.title.toLowerCase().includes(query.toLowerCase()) ||
                n.content.toLowerCase().includes(query.toLowerCase())
            );
        });

        const container = document.getElementById('subjectsContainer');
        renderSubjects(container, filteredSubjects.filter(s => s.notes.length > 0));
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            document.execCommand('bold', false, null);
        }
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            document.execCommand('italic', false, null);
        }
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            document.execCommand('underline', false, null);
        }
        if (e.ctrlKey && e.key === '\\') {
            e.preventDefault();
            this.toggleSidebar();
        }
    }

    exportCarpeta() {
        const data = {
            subjects: this.subjects,
            events: this.events,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `escriba_backup_${new Date().toLocaleDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Carpeta exportada', 'success');
    }

    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.subjects) {
                    this.subjects = data.subjects;
                    this.events = data.events || [];
                    this.settings = data.settings || this.settings;

                    saveSubjects(this.subjects);
                    saveEvents(this.events);
                    saveSettings(this.settings);

                    window.location.reload();
                }
            } catch (err) {
                showToast('Error al importar archivo', 'error');
            }
        };
        reader.readAsText(file);
    }

    loadSidebarState() {
        const compact = localStorage.getItem('sidebarCompact') === 'true';
        if (compact) {
            document.querySelector('.sidebar').classList.add('compact');
        }
    }

    saveSettings() {
        const theme = document.querySelector('.theme-option.active')?.dataset.theme || 'dark';
        const fontFamily = document.getElementById('fontFamily').value;
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const autoSave = document.getElementById('autoSave').checked;
        const expandSubjects = document.getElementById('expandSubjects').checked;
        const showWelcome = document.getElementById('showWelcome').checked;

        this.settings = {
            theme,
            fontFamily,
            fontSize,
            autoSave,
            expandSubjects,
            showWelcome
        };

        saveSettings(this.settings);
        applySettings();
        hideModal('settingsModal');
        showToast('Configuración guardada', 'success');
    }

    selectTheme(theme) {
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });
        document.documentElement.setAttribute('data-theme', theme);
    }

    selectColor(color) {
        this.selectedColor = color;
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === color);
        });
    }

    async handleGitHubAuth() {
        if (this.github.isAuthenticated) {
            try {
                const data = {
                    subjects: this.subjects,
                    events: this.events,
                    settings: this.settings
                };
                const merged = await this.github.sync(data);
                if (merged) {
                    this.subjects = merged.subjects;
                    this.events = merged.events;
                    this.settings = merged.settings;
                    saveSubjects(this.subjects);
                    saveEvents(this.events);
                    saveSettings(this.settings);
                    window.location.reload();
                }
            } catch (error) {
                showToast('Error en la sincronización', 'error');
            }
        } else {
            const token = prompt('Ingresá tu GitHub Personal Access Token (Classic):');
            if (token) {
                try {
                    await this.github.connectWithToken(token);
                    showToast('Conectado a GitHub', 'success');
                    this.handleGitHubAuth();
                } catch (error) {
                    showToast('Error de conexión: ' + error.message, 'error');
                }
            }
        }
    }

    async handleForcePull() {
        if (!confirm('Esto reemplazará tus datos locales con los de GitHub. ¿Continuar?')) return;
        try {
            const remoteData = await this.github.getRemoteData();
            this.subjects = remoteData.subjects;
            this.events = remoteData.events;
            this.settings = remoteData.settings;
            saveSubjects(this.subjects);
            saveEvents(this.events);
            saveSettings(this.settings);
            window.location.reload();
        } catch (error) {
            showToast('Error al descargar datos', 'error');
        }
    }

    async handleForcePush() {
        if (!confirm('Esto reemplazará los datos en GitHub con tus datos locales. ¿Continuar?')) return;
        try {
            const data = {
                subjects: this.subjects,
                events: this.events,
                settings: this.settings
            };
            await this.github.uploadData(data);
            showToast('Datos subidos a GitHub', 'success');
        } catch (error) {
            showToast('Error al subir datos', 'error');
        }
    }

    disconnectGitHub() {
        if (confirm('¿Estás seguro de que querés desconectar tu cuenta de GitHub?')) {
            this.github.logout();
            showToast('Cuenta desconectada', 'info');
        }
    }

    copyShareUrl() {
        if (!this.currentNoteId) return;
        const note = this.getNoteById(this.currentNoteId);
        if (note) {
            const url = `https://escriba.app/view?note=${this.currentNoteId}`; // Placeholder
            navigator.clipboard.writeText(url).then(() => {
                showToast('URL copiada al portapapeles', 'success');
            });
        }
    }

    shareToWhatsApp() {
        if (!this.currentNoteId) return;
        const note = this.getNoteById(this.currentNoteId);
        if (note) {
            const text = encodeURIComponent(`Mirá este apunte en Escriba: ${note.title}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    }

    shareToEmail() {
        if (!this.currentNoteId) return;
        const note = this.getNoteById(this.currentNoteId);
        if (note) {
            const subject = encodeURIComponent(note.title);
            const body = encodeURIComponent(note.content.substring(0, 500) + '...');
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }
    }

    exportCurrentNoteAsJson() {
        if (!this.currentNoteId) return;
        const note = this.getNoteById(this.currentNoteId);
        const subject = this.getSubjectOfNote(this.currentNoteId);

        if (note && subject) {
            const data = {
                app: 'escriba',
                v: '1.0',
                t: note.title,
                c: note.content,
                s: subject.name,
                sc: subject.color,
                cd: note.createdAt,
                ty: note.type
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${note.title.replace(/\s+/g, '_').toLowerCase()}.escriba.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const type = document.getElementById('eventType').value;
        const desc = document.getElementById('eventDesc').value;

        if (!title || !date) {
            showToast('Título y fecha son obligatorios', 'error');
            return;
        }

        const newEvent = {
            id: generateId(),
            title,
            date,
            type,
            description: desc,
            createdAt: new Date().toISOString()
        };

        this.events.push(newEvent);
        saveEvents(this.events);
        this.renderCalendar();
        hideModal('eventModal');
        showToast('Evento guardado', 'success');
    }

    deleteEvent() {
        if (!this.currentEventId) return;
        if (confirm('¿Eliminar este evento?')) {
            this.events = this.events.filter(e => e.id !== this.currentEventId);
            saveEvents(this.events);
            this.renderCalendar();
            hideModal('eventModal');
            showToast('Evento eliminado', 'info');
        }
    }

    getNoteById(noteId) {
        for (const s of this.subjects) {
            const note = s.notes.find(n => n.id === noteId);
            if (note) return note;
        }
        return null;
    }

    getSubjectOfNote(noteId) {
        return this.subjects.find(s => s.notes.some(n => n.id === noteId));
    }

    createInternalLink() {
        const selectedNoteId = document.querySelector('.link-note-item.selected')?.dataset.noteId;
        const linkText = document.getElementById('linkText').value.trim();

        if (!selectedNoteId || !linkText) {
            showToast('Seleccioná un apunte y escribí un texto', 'error');
            return;
        }

        const linkHtml = `<a href="#" class="internal-link" data-note-id="${selectedNoteId}">${escapeHtml(linkText)}</a>`;
        document.execCommand('insertHTML', false, linkHtml);
        hideModal('linkModal');
        showToast('Enlace creado', 'success');
    }

    searchNotesForLink(query) {
        const container = document.getElementById('linkNotesList');
        if (!container) return;

        const results = [];
        this.subjects.forEach(s => {
            s.notes.forEach(n => {
                if (n.title.toLowerCase().includes(query.toLowerCase()) || s.name.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ note: n, subject: s });
                }
            });
        });

        container.innerHTML = results.map(res => `
            <div class="link-note-item" data-note-id="${res.note.id}">
                <div class="subject-icon" style="background: ${res.subject.color}"></div>
                <div class="link-note-info">
                    <span class="link-note-title">${escapeHtml(res.note.title)}</span>
                    <span class="link-note-subject">${escapeHtml(res.subject.name)}</span>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.link-note-item').forEach(item => {
            item.addEventListener('click', () => {
                container.querySelectorAll('.link-note-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                document.getElementById('createLink').disabled = false;
            });
        });
    }

    populateEventSubjectDropdown() {
        const select = document.getElementById('eventSubject');
        if (!select) return;

        const options = this.subjects.map(s => `
            <option value="${s.id}">${escapeHtml(s.name)}</option>
        `).join('');

        select.innerHTML = '<option value="">Seleccionar materia...</option>' + options;
    }

    handleGitHubStatusChange(status, error) {
        const statusText = document.getElementById('githubStatusText');
        if (statusText) statusText.textContent = status;
    }

    insertCodeBlock() {
        const content = document.getElementById('noteContent');
        const br = document.createElement('br');
        const codeBlock = document.createElement('div');
        codeBlock.className = 'inline-ace-editor';
        codeBlock.id = `ace-${Date.now()}`;
        codeBlock.textContent = '// Escribí tu código acá';

        content.appendChild(br);
        content.appendChild(codeBlock);
        content.appendChild(document.createElement('br'));

        initializeAceEditor(codeBlock);
    }

    confirmDeleteSubject(subjectId) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        const noteCount = subject.notes.length;
        let message = `¿Estás seguro de que querés eliminar la materia "${subject.name}"?`;

        if (noteCount > 0) {
            message += `\n\nEsto también eliminará ${noteCount} apunte${noteCount !== 1 ? 's' : ''} asociado${noteCount !== 1 ? 's' : ''}.`;
        }

        message += '\n\nEsta acción no se puede deshacer.';

        if (confirm(message)) {
            this.deleteSubject(subjectId);
        }
    }

    deleteSubject(subjectId) {
        const index = this.subjects.findIndex(s => s.id === subjectId);
        if (index === -1) return;

        const subject = this.subjects[index];

        if (this.currentNoteId) {
            const hasNote = subject.notes.some(n => n.id === this.currentNoteId);
            if (hasNote) {
                this.currentNoteId = null;
                document.getElementById('noteEditor').style.display = 'none';
                showWelcomeScreen(true);
            }
        }

        this.subjects.splice(index, 1);
        saveSubjects(this.subjects);
        this.renderSubjects();
        showToast(`Materia "${subject.name}" eliminada`, 'success');

        if (this.subjects.length === 0) {
            showWelcomeScreen(true);
        }
    }

    handleJsonImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const noteData = JSON.parse(e.target.result);
                if (!noteData.app || noteData.app !== 'escriba') {
                    showToast('Este archivo no es un apunte válido de Escriba', 'error');
                    return;
                }
                this.importNoteFromJson(noteData);
            } catch (error) {
                showToast('Error al leer el archivo JSON', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    importNoteFromJson(noteData) {
        let subject = this.subjects.find(s => s.name === noteData.s);

        if (!subject) {
            subject = {
                id: generateId(),
                name: noteData.s,
                code: '',
                professor: '',
                color: noteData.sc || '#3b82f6',
                notes: [],
                expanded: true,
                createdAt: new Date().toISOString()
            };
            this.subjects.push(subject);
        }

        const newNote = {
            id: generateId(),
            title: noteData.t || 'Apunte importado',
            content: noteData.c || '',
            createdAt: noteData.cd || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            favorite: false,
            type: noteData.ty || 'lecture'
        };

        subject.notes.unshift(newNote);
        saveSubjects(this.subjects);
        this.renderSubjects();
        this.loadNote(newNote.id);
        showToast('Apunte importado correctamente', 'success');
    }

    toggleInlineCode() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = range.commonAncestorContainer;
        const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

        if (parent.tagName === 'CODE' || parent.closest('code')) {
            document.execCommand('formatBlock', false, 'p');
        } else {
            const code = document.createElement('code');
            code.appendChild(range.extractContents());
            range.insertNode(code);
        }
        updateToolbarStates();
    }

    toggleMathMode() {
        const select = document.getElementById('noteTypeSelect');
        if (select) {
            select.value = select.value === 'math' ? 'lecture' : 'math';
            updateToolbarStates();
        }
    }

    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.toggleMobileMenu();
            return;
        }

        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');

        if (!sidebar || !sidebarToggle) return;

        const isCompact = sidebar.classList.contains('compact');
        const icon = sidebarToggle.querySelector('i');

        if (isCompact) {
            sidebar.classList.remove('compact');
            sidebarToggle.classList.remove('compact');
            if (icon) icon.className = 'fas fa-angles-left';
            sidebarToggle.title = 'Alternar modo compacto (Ctrl+\\)';
            localStorage.setItem('sidebarCompact', 'false');
        } else {
            sidebar.classList.add('compact');
            sidebarToggle.classList.add('compact');
            if (icon) icon.className = 'fas fa-angles-right';
            sidebarToggle.title = 'Expandir sidebar (Ctrl+\\)';
            localStorage.setItem('sidebarCompact', 'true');
        }
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobileOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (!sidebar || !overlay || !toggle) return;

        const isOpen = sidebar.classList.contains('mobile-active');

        if (isOpen) {
            sidebar.classList.remove('mobile-active');
            overlay.classList.remove('active');
            toggle.innerHTML = '<i class="fas fa-bars"></i>';
        } else {
            sidebar.classList.add('mobile-active');
            overlay.classList.add('active');
            toggle.innerHTML = '<i class="fas fa-times"></i>';
        }
    }

    loadSidebarState() {
        const isCompact = localStorage.getItem('sidebarCompact') === 'true';
        if (isCompact && window.innerWidth > 768) {
            const sidebar = document.querySelector('.sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            if (sidebar && sidebarToggle) {
                sidebar.classList.add('compact');
                sidebarToggle.classList.add('compact');
                const icon = sidebarToggle.querySelector('i');
                if (icon) icon.className = 'fas fa-angles-right';
            }
        }
    }
}

const app = new EscribaApp();
window.cuaderno = app;
document.addEventListener('DOMContentLoaded', () => app.init());

export default app;
