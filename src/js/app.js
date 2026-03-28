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
    sanitizeText,
    highlightElement,
    clearHighlights
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
    renderSubjects,
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
import { MathManager } from './modules/editor/math-manager.js';

class EscribaApp {
    constructor() {
        const data = loadAllData();
        this.subjects = data.subjects;
        this.events = data.events;
        this.settings = data.settings || applySettings();

        this.currentNoteId = null;
        this.editingUMLContainer = null;
        this.currentView = 'subjects';
        this.selectedColor = '#3b82f6';
        this.autoSaveInterval = null;
        this.autoSyncInterval = null;
        this.currentDate = new Date();
        this.currentEventId = null;
        this.isViewingSharedNote = false;

        this.github = new GitHubManager({
            onStatusChange: (status, error) => this.handleGitHubStatusChange(status, error),
            showToast: (msg, type) => showToast(msg, type)
        });

        this.mathManager = new MathManager(this);

        this.floatingToolbar = document.getElementById('floatingToolbar');

        this.debouncedSave = debounce(() => this.saveCurrentNote(), 500);
    }

    async init() {
        document.body.classList.add('loading');

        this.bindEvents();
        applySettings();
        this.loadSidebarState();
        this.initMermaid();
        this.initFloatingToolbar();

        await this.checkForSharedNote();

        updateSemesterInfo(document.getElementById('currentSemester'));
        this.renderSubjects();
        saveSubjects(this.subjects);

        if (this.subjects.length === 0 && !this.isViewingSharedNote) {
            showWelcomeScreen(true);
        }

        this.switchView('subjects');

        setTimeout(() => {
            document.body.classList.remove('loading');
        }, 100);

        this.setupAutoSync();

        const hasGitHubToken = !!localStorage.getItem('github_access_token');
        this.handleGitHubStatusChange(hasGitHubToken ? 'connected' : 'disconnected');

        if (hasGitHubToken) {
            this.handleGitHubAuth(true);
        }
    }

    initMermaid() {
        if (typeof mermaid !== 'undefined') {
            const theme = document.documentElement.getAttribute('data-theme') || 'dark';
            let mermaidTheme = 'dark';

            if (theme === 'light') mermaidTheme = 'default';
            else if (theme === 'forest') mermaidTheme = 'forest';
            else if (theme === 'neutral') mermaidTheme = 'neutral';

            mermaid.initialize({
                startOnLoad: false,
                theme: mermaidTheme,
                securityLevel: 'loose',
                fontFamily: 'Inter, Arial, sans-serif',
                themeVariables: {
                    primaryColor: theme === 'light' ? '#4361ee' : '#3b82f6',
                    primaryTextColor: theme === 'light' ? '#212529' : '#f5f5f5',
                    primaryBorderColor: theme === 'light' ? '#dee2e6' : '#444',
                    lineColor: theme === 'light' ? '#888' : '#aaa',
                    secondaryColor: theme === 'light' ? '#f8f9fa' : '#2d2d2d',
                    tertiaryColor: theme === 'light' ? '#ffffff' : '#1a1a1a'
                }
            });
        }
    }

    bindEvents() {
        const welcomeBtn = document.getElementById('welcomeNewSubject') || document.getElementById('welcomeNewSubjectBtn');
        if (welcomeBtn) welcomeBtn.addEventListener('click', () => showModal('subjectModal'));

        const sidebarNewSubjectBtn = document.getElementById('sidebarNewSubjectBtn');
        if (sidebarNewSubjectBtn) sidebarNewSubjectBtn.addEventListener('click', () => showModal('subjectModal'));

        const sidebarNewNoteBtn = document.getElementById('sidebarNewNoteBtn');
        if (sidebarNewNoteBtn) sidebarNewNoteBtn.addEventListener('click', () => this.createNewNote());

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

        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;

                document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.settings-tab-panel').forEach(p => p.classList.remove('active'));
                const panel = document.getElementById(targetTab);
                if (panel) panel.classList.add('active');
            });
        });

        document.querySelectorAll('#exportBtn').forEach(btn => btn.addEventListener('click', () => this.exportCarpeta()));
        document.querySelectorAll('#importBtn').forEach(btn => btn.addEventListener('click', () => document.getElementById('importFile').click()));
        document.querySelectorAll('#importJsonBtn').forEach(btn => btn.addEventListener('click', () => document.getElementById('importJsonFile').click()));
        document.querySelectorAll('#printBtn').forEach(btn => btn.addEventListener('click', () => window.print()));

        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));
        document.getElementById('importJsonFile').addEventListener('change', (e) => this.handleJsonImport(e));

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.updateSettingsStats();
            loadSettingsToModal(this.settings);
            showModal('settingsModal');
        });

        document.querySelectorAll('#graphBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                showModal('graphModal');
                this.renderKnowledgeGraph();
            });
        });

        document.getElementById('closeGraph').addEventListener('click', () => hideModal('graphModal'));

        const cancelSettings = document.getElementById('cancelSettings');
        if (cancelSettings) cancelSettings.addEventListener('click', () => this.cancelSettings());

        initModalEvents((modalId) => {
            if (modalId === 'umlModal') {
                this.editingUMLContainer = null;
            } else if (modalId === 'subjectModal') {
                document.getElementById('subjectName').value = '';
                document.getElementById('subjectCode').value = '';
                document.getElementById('subjectProfessor').value = '';
            }
        });

        document.getElementById('createSubject').addEventListener('click', () => this.createSubject());

        const cancelSubjectBtn = document.getElementById('cancelSubject');
        if (cancelSubjectBtn) cancelSubjectBtn.addEventListener('click', () => hideModal('subjectModal'));

        const cancelSubjectPickerBtn = document.getElementById('cancelSubjectPicker');
        if (cancelSubjectPickerBtn) cancelSubjectPickerBtn.addEventListener('click', () => hideModal('subjectPickerModal'));

        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        const autoSyncCheckbox = document.getElementById('autoSync');
        if (autoSyncCheckbox) {
            autoSyncCheckbox.addEventListener('change', () => {
                if (autoSyncCheckbox.checked) this.startAutoSync();
                else this.stopAutoSync();
            });
        }

        document.getElementById('clearAllData').addEventListener('click', () => {
            if (confirm('¿Estás seguro de que querés borrar todos tus datos? Esta acción es irreversible.')) {
                localStorage.clear();
                window.location.reload();
            }
        });

        const deduplicateBtn = document.getElementById('deduplicateNotesBtn');
        if (deduplicateBtn) {
            deduplicateBtn.addEventListener('click', () => this.deduplicateNotes());
        }

        document.getElementById('noteContent').addEventListener('input', (e) => {
            if (e.inputType === 'insertText' && (e.data === ' ' || e.data === '\n')) {
                this.handleMarkdownAutoFormat(e);
            }
            updateToolbarStates();
            this.updateNoteStats();
            this.debouncedSave();
        });
        document.getElementById('noteTitle').addEventListener('input', () => this.debouncedSave());

        document.getElementById('noteContent').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.uml-delete-btn');
            const editBtn = e.target.closest('.uml-edit-btn');
            const codeDeleteBtn = e.target.closest('.code-block-delete-btn');

            if (deleteBtn) {
                const container = deleteBtn.closest('.uml-diagram-container');
                if (container && confirm('¿Eliminar este diagrama?')) {
                    container.remove();
                    this.debouncedSave();
                }
            } else if (editBtn) {
                const container = editBtn.closest('.uml-diagram-container');
                if (container) {
                    const code = container.getAttribute('data-uml-code');
                    document.getElementById('umlCode').value = code || '';
                    this.editingUMLContainer = container;
                    showModal('umlModal');

                    const preview = document.getElementById('umlPreview');
                    if (preview && code) updateUMLPreview({ getValue: () => code }, preview);
                }
            } else if (codeDeleteBtn) {
                const container = codeDeleteBtn.closest('.code-block-container');
                if (container && confirm('¿Eliminar este bloque de código?')) {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNode(container);
                    selection.removeAllRanges();
                    selection.addRange(range);

                    document.execCommand('delete', false, null);
                    this.debouncedSave();
                }
            }
        });

        document.getElementById('backlinksList').addEventListener('click', (e) => {
            const item = e.target.closest('.backlink-item');
            if (item) {
                const noteId = item.dataset.noteId;
                if (noteId) this.loadNote(noteId);
            }
        });

        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('exportMarkdownBtn').addEventListener('click', () => this.exportNoteToMarkdown());
        document.getElementById('shareNoteBtn').addEventListener('click', () => this.showShareModal());

        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.target.closest('.toolbar-btn').dataset.command;
                if (command) {
                    document.execCommand(command, false, null);
                    updateToolbarStates();
                }
            });
        });

        document.getElementById('highlightBtn').addEventListener('click', () => this.toggleHighlight());
        document.getElementById('inlineCodeBtn').addEventListener('click', () => this.toggleInlineCode());
        document.getElementById('insertCodeBtn').addEventListener('click', () => this.insertCodeBlock());
        document.getElementById('insertLinkBtn').addEventListener('click', () => showModal('linkModal'));
        document.getElementById('mathModeBtn').addEventListener('click', () => this.toggleMathMode());
        document.getElementById('insertUMLBtn').addEventListener('click', () => showModal('umlModal'));
        document.getElementById('insertUMLDiagram').addEventListener('click', () => this.handleInsertUML());

        const cancelUMLBtn = document.getElementById('cancelUML');
        if (cancelUMLBtn) cancelUMLBtn.addEventListener('click', () => hideModal('umlModal'));

        const umlCode = document.getElementById('umlCode');
        if (umlCode) {
            umlCode.addEventListener('input', debounce(() => {
                const preview = document.getElementById('umlPreview');
                if (preview) updateUMLPreview({ getValue: () => umlCode.value }, preview);
            }, 300));
        }

        document.querySelectorAll('.uml-template-btn').forEach(btn => {
            btn.addEventListener('click', () => this.applyUMLTemplate(btn.dataset.type));
        });

        document.addEventListener('click', (e) => {
            const githubTarget = e.target.closest('#githubStatus, #settingsSyncButton, #syncButton');
            if (githubTarget) {
                console.log(`[AUTH] Click detected on ${githubTarget.id}`);
                this.handleGitHubAuth();
            }

            const pullTarget = e.target.closest('#pullButton, #settingsPullBtn');
            if (pullTarget) this.handleForcePull();

            const pushTarget = e.target.closest('#pushButton, #settingsPushBtn');
            if (pushTarget) this.handleForcePush();

            const disconnectTarget = e.target.closest('#disconnectGitHub, #disconnectButton');
            if (disconnectTarget) this.disconnectGitHub();
        });

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        document.getElementById('cancelShare').addEventListener('click', () => hideModal('shareModal'));
        document.getElementById('copyUrlBtn').addEventListener('click', () => this.copyShareUrl());
        document.getElementById('shareWhatsApp').addEventListener('click', () => this.shareToWhatsApp());
        document.getElementById('shareEmail').addEventListener('click', () => this.shareToEmail());
        document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportCurrentNoteAsJson());

        document.getElementById('confirmToken').addEventListener('click', () => this.handleConfirmToken());
        document.getElementById('cancelToken').addEventListener('click', () => hideModal('githubTokenModal'));

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

    renderSubjects() {
        const container = document.getElementById('subjectsContainer');
        if (!container) return;

        renderSubjects(container, this.subjects, {
            onSubjectClick: (id) => this.toggleSubject(id),
            onNoteClick: (id) => this.loadNote(id),
            onAddNote: (id) => this.addNoteToSubject(id),
            onDeleteSubject: (id) => this.confirmDeleteSubject(id),
            onAddSubject: () => showModal('subjectModal')
        });

        if (this.currentView === 'recent') this.renderRecentView();
        if (this.currentView === 'favorites') this.renderFavoritesView();
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
        subject.lastModified = new Date().toISOString();
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
        this.bindInternalLinkListeners();
        document.getElementById('noteSubject').textContent = foundSubject.name;
        document.getElementById('noteDate').textContent = formatDate(foundNote.updatedAt);

        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('noteEditor').style.display = 'flex';
        document.getElementById('editorFooter').style.display = 'flex';

        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.toggle('active', item.dataset.noteId === noteId);
        });

        this.reRenderAllDiagrams();
        this.mathManager.sync(foundNote);
        this.updateNoteStats();
        this.updateBacklinks(noteId);
        clearHighlights(document.getElementById('noteContent'));
        updateToolbarStates();
    }

    async saveCurrentNote() {
        if (!this.currentNoteId) return;

        const title = document.getElementById('noteTitle').value.trim() || 'Apunte sin título';
        const content = document.getElementById('noteContent').innerHTML;

        this.subjects.forEach(s => {
            const note = s.notes.find(n => n.id === this.currentNoteId);
            if (note) {
                note.title = title;
                note.content = content;
                note.updatedAt = new Date().toISOString();
                s.lastModified = new Date().toISOString();
            }
        });

        saveSubjects(this.subjects);
        this.updateSettingsStats();
    }

    toggleSubject(id) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            subject.expanded = !subject.expanded;
            subject.lastModified = new Date().toISOString();
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
            expanded: this.settings && typeof this.settings.expandSubjects !== 'undefined' ? this.settings.expandSubjects : true,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
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
                s.lastModified = new Date().toISOString();
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
                s.lastModified = new Date().toISOString();
                showToast(note.favorite ? 'Agregado a favoritos' : 'Eliminado de favoritos', 'info');
                const favoriteBtn = document.getElementById('favoriteBtn');
                if (favoriteBtn) favoriteBtn.classList.toggle('active', note.favorite);
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

        const container = document.getElementById('subjectsContainer');
        const filteredSubjects = JSON.parse(JSON.stringify(this.subjects));
        filteredSubjects.forEach(s => {
            s.notes = s.notes.filter(n =>
                n.title.toLowerCase().includes(query.toLowerCase()) ||
                n.content.toLowerCase().includes(query.toLowerCase())
            );
        });

        renderSubjects(container, filteredSubjects.filter(s => s.notes.length > 0), {
            onSubjectClick: (id) => this.toggleSubject(id),
            onNoteClick: (id) => this.loadNote(id),
            onAddNote: (id) => this.addNoteToSubject(id),
            onDeleteSubject: (id) => this.confirmDeleteSubject(id),
            onAddSubject: () => showModal('subjectModal')
        });

        const activeNoteContent = document.getElementById('noteContent');
        if (activeNoteContent) {
            highlightElement(activeNoteContent, query);
        }
    }

    handleKeyboardShortcuts(e) {
        const noteContent = document.getElementById('noteContent');
        const activeElement = document.activeElement;

        const isNoteContentFocused = noteContent && (noteContent.contains(activeElement) || noteContent === activeElement);

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    if (isNoteContentFocused) {
                        e.preventDefault();
                        document.execCommand('bold', false, null);
                    }
                    break;
                case 'i':
                    if (isNoteContentFocused) {
                        e.preventDefault();
                        document.execCommand('italic', false, null);
                    }
                    break;
                case 'u':
                    if (isNoteContentFocused) {
                        e.preventDefault();
                        document.execCommand('underline', false, null);
                    }
                    break;
                case 's':
                    e.preventDefault();
                    this.debouncedSave();
                    showToast('Apunte guardado', 'info');
                    break;
                case '`':
                    if (isNoteContentFocused) {
                        e.preventDefault();
                        this.toggleInlineCode();
                    }
                    break;
                case 'm':
                    if (isNoteContentFocused) {
                        e.preventDefault();
                        this.toggleMathMode();
                    }
                    break;
                case 'z':
                    if (isNoteContentFocused) {
                        if (e.shiftKey) {
                            e.preventDefault();
                            document.execCommand('redo');
                        }
                    }
                    break;
                case 'y':
                    if (isNoteContentFocused) {
                        e.preventDefault();
                        document.execCommand('redo');
                    }
                    break;
                case '\\':
                    e.preventDefault();
                    this.toggleSidebar();
                    break;
            }
            return;
        }

        if (isNoteContentFocused && e.key === 'Tab') {
            e.preventDefault();
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (!range.collapsed) {
                    this.handleTabIndentationForSelection(range, e.shiftKey);
                } else {
                    this.insertTabIndentation();
                }
            }
            this.debouncedSave();
        }
    }

    insertTabIndentation() {
        const tabSpaces = '    ';
        try {
            document.execCommand('insertText', false, tabSpaces);
        } catch (error) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const textNode = document.createTextNode(tabSpaces);
                range.insertNode(textNode);
                range.setStartAfter(textNode);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    handleTabIndentationForSelection(range, isShiftTab) {
        try {
            const selection = window.getSelection();
            const selectedContent = range.extractContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(selectedContent);
            let content = tempDiv.innerHTML;

            if (isShiftTab) {
                content = this.reduceIndentation(content);
            } else {
                content = this.increaseIndentation(content);
            }

            const fragment = range.createContextualFragment(content);
            range.insertNode(fragment);
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (error) {
            console.warn('Error processing selection indentation:', error);
            document.execCommand(isShiftTab ? 'outdent' : 'indent');
        }
    }

    bindInternalLinkListeners() {
        const noteContent = document.getElementById('noteContent');
        if (!noteContent) return;

        noteContent.querySelectorAll('.internal-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const noteId = link.dataset.noteId;
                if (noteId) {
                    this.loadNote(noteId);
                }
            });
        });
    }

    handleMarkdownAutoFormat(e) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) return;

        const text = node.textContent;
        const offset = range.startOffset;
        const lineText = text.substring(0, offset);

        const rules = [
            { pattern: /^#\s$/, command: 'formatBlock', value: 'h1' },
            { pattern: /^##\s$/, command: 'formatBlock', value: 'h2' },
            { pattern: /^###\s$/, command: 'formatBlock', value: 'h3' },
            { pattern: /^([\-\*])\s$/, command: 'insertUnorderedList', value: null },
            { pattern: /^1\.\s$/, command: 'insertOrderedList', value: null },
            { pattern: /^>\s$/, command: 'formatBlock', value: 'blockquote' }
        ];

        for (const rule of rules) {
            const match = lineText.match(rule.pattern);
            if (match) {
                e.preventDefault();

                const newText = text.substring(offset);
                node.textContent = newText;

                document.execCommand(rule.command, false, rule.value);
                break;
            }
        }
    }

    increaseIndentation(htmlContent) {
        const tabSpaces = '&nbsp;&nbsp;&nbsp;&nbsp;';
        return htmlContent
            .replace(/^/gm, tabSpaces)
            .replace(/(<br\s*\/?>)/gi, '$1' + tabSpaces)
            .replace(/(<div[^>]*>)/gi, '$1' + tabSpaces);
    }

    reduceIndentation(htmlContent) {
        return htmlContent
            .replace(/^(&nbsp;|\s){1,4}/gm, '')
            .replace(/(<br\s*\/?>)(\s|&nbsp;){1,4}/gi, '$1')
            .replace(/(<div[^>]*>)(\s|&nbsp;){1,4}/gi, '$1');
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
        const autoSync = document.getElementById('autoSync').checked;
        const expandSubjects = document.getElementById('expandSubjects').checked;
        const showWelcome = document.getElementById('showWelcome').checked;

        this.settings = {
            theme,
            fontFamily,
            fontSize,
            autoSave,
            autoSync,
            expandSubjects,
            showWelcome
        };

        saveSettings(this.settings);
        applySettings();
        hideModal('settingsModal');
        showToast('Configuración guardada', 'success');
    }

    cancelSettings() {
        applySettings();
        hideModal('settingsModal');
    }

    applyUMLTemplate(type) {
        const templates = {
            'class': 'classDiagram\n    Animal <|-- Duck\n    Animal <|-- Fish\n    Animal <|-- Zebra\n    Animal : +int age\n    Animal : +String gender\n    Animal: +isMammal()\n    Animal: +mate()',
            'sequence': 'sequenceDiagram\n    Alice->>Bob: Hello Bob, how are you?\n    Bob-->>Alice: Jolly good!',
            'flowchart': 'graph TD\n    A[Start] --> B{Is it?}\n    B -- Yes --> C[OK]\n    C --> D[Rethink]\n    D --> B\n    B -- No ----> E[End]',
            'er': 'erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains',
            'state': 'stateDiagram-v2\n    [*] --> Still\n    Still --> [*]\n    Still --> Moving\n    Moving --> Still\n    Moving --> Crash\n    Crash --> [*]',
            'git': 'gitGraph\n    commit\n    commit\n    branch develop\n    checkout develop\n    commit\n    commit\n    checkout main\n    merge develop\n    commit',
            'pie': 'pie title Pets adopted by volunteers\n    "Dogs" : 386\n    "Cats" : 85\n    "Rats" : 15',
            'journey': 'journey\n    title My working day\n    section Go to work\n      Make tea: 5: Me\n      Go upstairs: 3: Me\n      Do work: 1: Me\n    section Go home\n      Go downstairs: 5: Me\n      Sit down: 3: Me'
        };

        const code = templates[type] || '';
        document.getElementById('umlCode').value = code;
        const preview = document.getElementById('umlPreview');
        if (preview) updateUMLPreview({ getValue: () => code }, preview);
    }

    updateSettingsStats() {
        const totalSubjects = this.subjects.length;
        let totalNotes = 0;
        let totalWords = 0;

        this.subjects.forEach(subject => {
            totalNotes += subject.notes.length;
            subject.notes.forEach(note => {
                if (note.content) {
                    const text = note.content.replace(/<[^>]*>?/gm, ' ');
                    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
                    totalWords += words.length;
                }
            });
        });

        const countSubjects = document.getElementById('countSubjects');
        const countNotes = document.getElementById('countNotes');
        const countWords = document.getElementById('countWords');

        if (countSubjects) countSubjects.textContent = totalSubjects;
        if (countNotes) countNotes.textContent = totalNotes;
        if (countWords) countWords.textContent = totalWords;
    }

    deduplicateNotes() {
        let removedCount = 0;
        const seenIds = new Set();
        const seenContent = new Set();

        this.subjects.forEach(subject => {
            const originalCount = subject.notes.length;
            const uniqueNotes = [];

            subject.notes.forEach(note => {
                const contentSignature = `${subject.id}|${note.title.trim()}|${note.content.trim()}`;

                if (seenIds.has(note.id)) {
                    removedCount++;
                    return;
                }

                if (seenContent.has(contentSignature)) {
                    removedCount++;
                    return;
                }

                seenIds.add(note.id);
                seenContent.add(contentSignature);
                uniqueNotes.push(note);
            });

            if (uniqueNotes.length !== originalCount) {
                subject.notes = uniqueNotes;
                subject.lastModified = new Date().toISOString();
            }
        });

        if (removedCount > 0) {
            saveSubjects(this.subjects);
            this.renderSubjects();
            this.updateSettingsStats();
            showToast(`Se eliminaron ${removedCount} apuntes duplicados`, 'success');

            if (this.currentNoteId && !seenIds.has(this.currentNoteId)) {
                this.currentNoteId = null;
                document.getElementById('noteEditor').style.display = 'none';
                showWelcomeScreen(true);
            }
        } else {
            showToast('No se encontraron apuntes duplicados', 'info');
        }
    }

    selectTheme(theme) {
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });
        document.documentElement.setAttribute('data-theme', theme);

        this.initMermaid();
        this.reRenderAllDiagrams();
    }

    reRenderAllDiagrams() {
        if (typeof mermaid === 'undefined') return;

        const diagrams = document.querySelectorAll('.uml-diagram-container');
        diagrams.forEach(container => {
            const content = container.querySelector('.uml-diagram-content');
            const code = container.getAttribute('data-uml-code');
            if (content && code) {
                if (!content.id) {
                    content.id = 'uml-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                }
                renderUMLDiagram(content.id, code);
            }
        });
    }

    async handleInsertUML() {
        const umlCode = document.getElementById('umlCode').value.trim();
        if (!umlCode) {
            showToast('Ingresá código Mermaid', 'error');
            return;
        }

        const diagramType = detectDiagramType(umlCode);
        const diagramTypeName = getDiagramTypeName(diagramType);

        if (this.editingUMLContainer) {
            const diagramId = this.editingUMLContainer.querySelector('.uml-diagram-content').id;
            this.editingUMLContainer.setAttribute('data-uml-code', umlCode);
            this.editingUMLContainer.setAttribute('data-diagram-type', diagramType);
            this.editingUMLContainer.querySelector('.uml-diagram-type').innerHTML = `<i class="fas fa-project-diagram"></i> Diagrama ${diagramTypeName}`;

            const content = this.editingUMLContainer.querySelector('.uml-diagram-content');
            content.innerHTML = `<div class="uml-loading"><i class="fas fa-spinner fa-spin"></i> Actualizando diagrama...</div>`;

            await renderUMLDiagram(diagramId, umlCode);
            this.editingUMLContainer = null;

            hideModal('umlModal');
            document.getElementById('umlCode').value = '';
            this.debouncedSave();
            return;
        }

        const diagramId = 'uml-' + Date.now();
        const container = document.createElement('div');
        container.className = 'uml-diagram-container';
        container.setAttribute('data-uml-code', umlCode);
        container.setAttribute('data-diagram-type', diagramType);
        container.contentEditable = false;

        container.innerHTML = `
            <div class="uml-diagram-header">
                <span class="uml-diagram-type"><i class="fas fa-project-diagram"></i> Diagrama ${diagramTypeName}</span>
                <div class="uml-diagram-actions">
                    <button class="uml-edit-btn" title="Editar diagrama"><i class="fas fa-edit"></i></button>
                    <button class="uml-delete-btn" title="Eliminar diagrama"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div id="${diagramId}" class="uml-diagram-content">
                <div class="uml-loading"><i class="fas fa-spinner fa-spin"></i> Generando diagrama...</div>
            </div>
        `;

        const noteContent = document.getElementById('noteContent');
        const selection = window.getSelection();
        let inserted = false;

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (noteContent.contains(range.commonAncestorContainer)) {
                range.deleteContents();
                range.insertNode(container);

                const brBefore = document.createElement('br');
                const brAfter = document.createElement('br');
                container.before(brBefore);
                container.after(brAfter);

                inserted = true;
            }
        }

        if (!inserted) {
            noteContent.appendChild(document.createElement('br'));
            noteContent.appendChild(container);
            noteContent.appendChild(document.createElement('br'));
        }

        await renderUMLDiagram(diagramId, umlCode);

        hideModal('umlModal');
        document.getElementById('umlCode').value = '';
        this.debouncedSave();
    }

    selectColor(color) {
        this.selectedColor = color;
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === color);
        });
    }

    async handleGitHubAuth(silent = false) {
        if (this._isAuthenticating) return;
        this._isAuthenticating = true;

        const githubStatus = document.getElementById('githubStatus');
        const originalContent = githubStatus ? githubStatus.innerHTML : '';

        try {
            if (!silent && githubStatus) {
                githubStatus.innerHTML = '<i class="fas fa-sync fa-spin"></i> <span>Conectando...</span>';
            }

            if (this.github.isAuthenticated) {
                if (this.currentNoteId) {
                    await this.saveCurrentNote();
                }

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

                    if (!silent) {
                        window.location.reload();
                    } else {
                        this.renderSubjects();
                        showToast('Sincronizado con GitHub', 'success');
                    }
                }
            } else {
                const existingModal = document.querySelector('#githubTokenModal.active');
                if (!existingModal) {
                    const tokenInput = document.getElementById('githubTokenInput');
                    if (tokenInput) tokenInput.value = '';
                    showModal('githubTokenModal');
                }

                if (this.currentNoteId) {
                    this.saveCurrentNote().catch(err => console.warn('Background save failed:', err));
                }
            }
        } catch (error) {
            console.error('GitHub Auth/Sync Error:', error);

            const isAuthError = error.message.includes('401') ||
                error.message.includes('expired') ||
                error.message.includes('expirada');

            if (isAuthError) {
                showToast('Sesión de GitHub expirada. Por favor, volvé a conectar.', 'error');
                this.github.logout();
            } else if (!silent) {
                showToast('Error de conexión: ' + (error.message || 'Error desconocido'), 'error');
            }
        } finally {
            this._isAuthenticating = false;
            if (!silent && githubStatus && !this.github.isAuthenticated) {
                githubStatus.innerHTML = originalContent;
            }
        }
    }

    async handleConfirmToken() {
        const tokenInput = document.getElementById('githubTokenInput');
        const token = tokenInput.value ? tokenInput.value.trim() : '';

        if (!token) {
            showToast('Por favor, ingresá un token válido', 'error');
            return;
        }

        const confirmBtn = document.getElementById('confirmToken');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';

        try {
            await this.github.connectWithToken(token);
            hideModal('githubTokenModal');
            showToast('Conectado a GitHub con éxito', 'success');
            this.handleGitHubAuth(true);
        } catch (error) {
            showToast('Error de conexión: ' + error.message, 'error');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
        }
    }

    switchView(view) {
        this.currentView = view;

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        const containers = {
            subjects: document.getElementById('subjectsContainer'),
            recent: document.getElementById('recentContainer'),
            favorites: document.getElementById('favoritesContainer'),
            calendar: document.getElementById('calendarContainer')
        };

        Object.keys(containers).forEach(key => {
            if (containers[key]) {
                containers[key].style.display = key === view ? (key === 'calendar' ? 'flex' : 'block') : 'none';
            }
        });

        switch (view) {
            case 'subjects':
                this.renderSubjects();
                break;
            case 'recent':
                this.renderRecentView();
                break;
            case 'favorites':
                this.renderFavoritesView();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
        }
    }

    renderRecentView() {
        const container = document.getElementById('recentContainer');
        if (container) {
            renderRecentNotes(container, this.subjects, this.currentNoteId, {
                onNoteClick: (id) => this.loadNote(id)
            });
        }
    }

    renderFavoritesView() {
        const container = document.getElementById('favoritesContainer');
        if (container) {
            renderFavoriteNotes(container, this.subjects, this.currentNoteId, {
                onNoteClick: (id) => this.loadNote(id)
            });
        }
    }

    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const header = document.getElementById('currentMonth');

        updateCalendarHeader(header, this.currentDate);
        renderCalendarGrid(grid, this.currentDate, this.events, (day, date, isDiffMonth, isToday) => {
            const dayElement = document.createElement('div');
            dayElement.className = `calendar-day${isDiffMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`;

            const hasEvents = this.events.some(e => new Date(e.date).toDateString() === date.toDateString());
            if (hasEvents) dayElement.classList.add('has-events');

            dayElement.innerHTML = `<span class="day-number">${day}</span>`;
            dayElement.addEventListener('click', () => this.showEventModal(date));

            return dayElement;
        });

        this.renderEventsList();
    }

    renderEventsList() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        const upcomingEvents = this.getUpcomingEvents();

        if (upcomingEvents.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-events">
                    <i class="fas fa-calendar-check"></i>
                    <p>No hay exámenes próximos</p>
                </div>
            `;
            return;
        }

        eventsList.innerHTML = upcomingEvents.map(event => {
            const timeLeft = this.getTimeLeft(event.date);
            const subject = this.subjects.find(s => s.id === event.subjectId);
            return `
                <div class="event-item" data-event-id="${event.id}">
                    <div class="event-icon">${this.getEventTypeIcon(event.type)}</div>
                    <div class="event-details">
                        <div class="event-title">${escapeHtml(event.title)}</div>
                        <div class="event-meta">
                            <span><i class="fas fa-calendar"></i> ${this.formatEventDate(event.date)}</span>
                            <span><i class="fas fa-book"></i> ${escapeHtml(subject ? subject.name : 'Sin materia')}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getUpcomingEvents() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.events
            .filter(e => new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 10);
    }

    getTimeLeft(eventDate) {
        const diff = new Date(eventDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days <= 0) return { text: 'Hoy', class: 'urgent' };
        if (days === 1) return { text: 'Mañana', class: 'urgent' };
        return { text: `${days} días`, class: days <= 7 ? 'soon' : 'normal' };
    }

    getEventTypeIcon(type) {
        const icons = { parcial: '📊', final: '🎯', tp: '📋', quiz: '❓' };
        return icons[type] || '📅';
    }

    formatEventDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('es-AR', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    async checkForSharedNote() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('share');
        const gistId = urlParams.get('gist');
        const githubPath = urlParams.get('github');

        if (!sharedData && !gistId && !githubPath) {
            return;
        }

        try {
            this.showLoadingIndicator('Cargando apunte compartido...');

            if (githubPath) {
                await this.loadFromGitHub(githubPath);
            } else if (gistId) {
                await this.loadFromGist(gistId);
            } else if (sharedData) {
                const decodedData = JSON.parse(this.base64ToUtf8(sharedData));
                this.displaySharedNote(decodedData);
            }

            this.isViewingSharedNote = true;
            this.hideLoadingIndicator();
        } catch (error) {
            console.error('Error loading shared note:', error);
            this.hideLoadingIndicator();
            this.showSharedNoteError(error);
        }
    }

    async loadFromGist(gistId) {
        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const gist = await response.json();
            const files = Object.values(gist.files);
            if (files.length === 0) throw new Error('No files found in Gist');

            const jsonFile = files.find(file =>
                file.filename.includes('.json') ||
                file.filename.includes('escriba')
            ) || files[0];

            const noteData = JSON.parse(jsonFile.content);
            if (noteData.app !== 'escriba') throw new Error('Invalid Escriba note');

            this.displaySharedNote(noteData);
        } catch (error) {
            console.error('Error loading from Gist:', error);
            showToast('No se pudo cargar el apunte desde Gist', 'error');
            throw error;
        }
    }

    async loadFromGitHub(githubPath) {
        try {
            const pathParts = githubPath.split('/');
            if (pathParts.length < 3) throw new Error('Invalid GitHub path format');

            const username = pathParts[0];
            const repoName = pathParts[1];
            const filePath = pathParts.slice(2).join('/');
            const apiUrl = `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`;

            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            if (!response.ok) {
                if (response.status === 404) throw new Error('El apunte no existe');
                throw new Error(`GitHub Error: ${response.status}`);
            }

            const fileData = await response.json();
            const decodedContent = this.base64ToUtf8(fileData.content);

            let noteData;
            if (filePath.endsWith('.md')) {
                const filename = filePath.split('/').pop().replace('.md', '');
                let subjectName = 'Materia';
                if (filePath.startsWith('notes/')) {
                    const parts = filePath.split('/');
                    if (parts.length > 2) {
                        subjectName = decodeURIComponent(parts[1]);
                    }
                }
                noteData = {
                    title: decodeURIComponent(filename),
                    content: decodedContent,
                    type: 'lecture',
                    subject: subjectName
                };
            } else {
                noteData = JSON.parse(decodedContent);
                if (!noteData.content && !noteData.c) {
                    throw new Error('Formato de apunte inválido');
                }
            }

            noteData.shared_from = {
                type: 'github_repo',
                username,
                repo: repoName,
                path: filePath
            };

            this.displaySharedNote(noteData);
        } catch (error) {
            console.error('Error loading from GitHub:', error);
            showToast('No se pudo cargar desde GitHub', 'error');
            throw error;
        }
    }

    displaySharedNote(noteData) {
        const title = noteData.title || noteData.t || 'Apunte Compartido';
        const content = noteData.content || noteData.c || '';
        const type = noteData.type || noteData.ty || 'lecture';
        const subject = noteData.subject || noteData.s || 'Materia';

        document.getElementById('noteTitle').value = title;
        document.getElementById('noteTitle').disabled = true;
        document.getElementById('noteContent').innerHTML = content;
        document.getElementById('noteContent').contentEditable = false;
        document.getElementById('noteSubject').textContent = subject;

        const welcomeScreen = document.getElementById('welcomeScreen');
        const noteEditor = document.getElementById('noteEditor');
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (noteEditor) noteEditor.style.display = 'flex';

        const buttonsToHide = ['favoriteBtn', 'shareNoteBtn', 'deleteNoteBtn'];
        buttonsToHide.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });

        const toolbar = document.querySelector('.editor-toolbar');
        if (toolbar) toolbar.style.display = 'none';

        this.addSharedNoteBanner(noteData);

        setTimeout(() => {
            if (content.includes('uml-diagram-container')) {
                document.querySelectorAll('.uml-diagram-content').forEach(container => {
                    const code = container.closest('.uml-diagram-container').getAttribute('data-uml-code');
                    if (code) renderUMLDiagram(container.id, code);
                });
            }
        }, 100);
    }

    addSharedNoteBanner(noteData) {
        const noteEditor = document.getElementById('noteEditor');
        if (!noteEditor) return;

        const existing = noteEditor.querySelector('.shared-note-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.className = 'shared-note-banner';

        let origin = 'un enlace compartido';
        if (noteData.shared_from?.type === 'github_repo') {
            origin = `el repositorio ${noteData.shared_from.username}/${noteData.shared_from.repo}`;
        }

        banner.innerHTML = `
            <div class="shared-banner-content">
                <i class="fas fa-share-alt"></i>
                <span>Apunte compartido de <strong>${escapeHtml(noteData.subject || 'Materia')}</strong> desde ${origin}</span>
                <div class="banner-actions">
                    <button id="importNoteBtn" class="btn btn-primary btn-sm">Importar a mis apuntes</button>
                    <button onclick="window.location.href=window.location.pathname" class="btn btn-secondary btn-sm">Ir a mi Escriba</button>
                </div>
            </div>
        `;

        noteEditor.insertBefore(banner, noteEditor.firstChild);
        document.getElementById('importNoteBtn').addEventListener('click', () => this.importSharedNote(noteData));
    }

    importSharedNote(noteData) {
        let subject = this.subjects.find(s => s.name === noteData.subject);
        if (!subject) {
            subject = {
                id: generateId('subject'),
                name: noteData.subject || 'Importados',
                color: noteData.subjectColor || '#3b82f6',
                notes: [],
                expanded: this.settings && typeof this.settings.expandSubjects !== 'undefined' ? this.settings.expandSubjects : true,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            this.subjects.unshift(subject);
        }

        const note = {
            id: generateId('note'),
            title: (noteData.title || noteData.t) + ' (Importado)',
            content: noteData.content || noteData.c,
            type: noteData.type || noteData.ty || 'lecture',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            favorite: false
        };

        subject.notes.unshift(note);
        subject.lastModified = new Date().toISOString();
        saveSubjects(this.subjects);
        window.location.href = window.location.pathname;
    }

    showSharedNoteError(error) {
        const noteEditor = document.getElementById('noteEditor');
        if (!noteEditor) return;

        noteEditor.innerHTML = `
            <div class="shared-note-error">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Error al cargar el apunte</h2>
                <p>${error.message}</p>
                <button onclick="window.location.href=window.location.pathname" class="btn btn-primary">Volver al inicio</button>
            </div>
        `;
    }

    showLoadingIndicator(msg) {
        document.body.classList.add('loading');
    }

    hideLoadingIndicator() {
        document.body.classList.remove('loading');
    }

    utf8ToBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    base64ToUtf8(str) {
        return decodeURIComponent(escape(atob(str)));
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
            this.stopAutoSync();
            this.github.logout();
            showToast('Cuenta desconectada', 'info');
        }
    }

    setupAutoSync() {
        if (this.settings && this.settings.autoSync) {
            this.startAutoSync();
        }
    }

    startAutoSync() {
        this.stopAutoSync();
        if (!this.github.isAuthenticated) return;

        console.log('Starting auto-sync interval (5 minutes)');
        this.autoSyncInterval = setInterval(() => {
            if (this.github.isAuthenticated) {
                this.handleGitHubAuth(true);
            }
        }, 5 * 60 * 1000);
    }

    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
    }

    copyShareUrl() {
        const shareUrl = document.getElementById('shareUrl');
        if (!shareUrl) return;

        shareUrl.select();
        shareUrl.setSelectionRange(0, 99999);

        try {
            document.execCommand('copy');
            showToast('Enlace copiado al portapapeles', 'success');
        } catch (err) {
            navigator.clipboard.writeText(shareUrl.value).then(() => {
                showToast('Enlace copiado al portapapeles', 'success');
            }).catch(() => {
                showToast('No se pudo copiar el enlace', 'error');
            });
        }
    }

    shareToWhatsApp() {
        const shareUrl = document.getElementById('shareUrl')?.value;
        const note = this.getNoteById(this.currentNoteId);
        const subject = this.getSubjectOfNote(this.currentNoteId);

        if (!note || !subject || !shareUrl) return;

        const message = `📚 Te comparto mis apuntes de ${subject.name}: "${note.title}"\n\n${shareUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    shareToEmail() {
        const shareUrl = document.getElementById('shareUrl')?.value;
        const note = this.getNoteById(this.currentNoteId);
        const subject = this.getSubjectOfNote(this.currentNoteId);

        if (!note || !subject || !shareUrl) return;

        const mailSubject = encodeURIComponent(`Apuntes de ${subject.name}: ${note.title}`);
        const mailBody = encodeURIComponent(`Hola! Te comparto este apunte de Escriba:\n\n${note.title} (${subject.name})\n\n${shareUrl}`);
        window.location.href = `mailto:?subject=${mailSubject}&body=${mailBody}`;
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
                ty: note.type,
                m: note.mathMode
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
    async showShareModal() {
        if (!this.currentNoteId) {
            showToast('No hay ningún apunte abierto para compartir', 'error');
            return;
        }

        showModal('shareModal');

        const githubSyncInfo = document.getElementById('githubSyncShareInfo');
        if (this.github && this.github.isAuthenticated) {
            githubSyncInfo.style.display = 'block';
            const repoPath = `${this.github.username}/${this.github.repoName}`;
            document.getElementById('githubRepoPath').textContent = repoPath;
        } else {
            githubSyncInfo.style.display = 'none';
        }

        const shareUrlInput = document.getElementById('shareUrl');
        const methodInfo = document.getElementById('shareMethodInfo');

        shareUrlInput.value = 'Generando enlace...';
        methodInfo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando enlace...';

        this.initQRPlaceholder();

        try {
            const result = await this.generateShareUrlWithInfo();
            shareUrlInput.value = result.url;
            methodInfo.innerHTML = result.methodInfo;
            this.generateQRCode(result.url);
        } catch (error) {
            console.error('Error generating share URL:', error);
            shareUrlInput.value = 'Error al generar enlace';
            methodInfo.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error al generar enlace';
        }
    }

    initQRPlaceholder() {
        const canvas = document.getElementById('qrCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 180, 180);
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 180, 180);
        ctx.fillStyle = '#6c757d';
        ctx.font = '14px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Generando QR...', 90, 90);
    }

    async generateShareUrlWithInfo() {
        const url = await this.generateShareUrl();
        let methodInfo = '';

        if (url.includes('gist=')) {
            methodInfo = '<i class="fab fa-github"></i> <strong>GitHub Gist</strong> - Enlace público optimizado';
        } else if (url.includes('github=')) {
            methodInfo = '<i class="fab fa-github"></i> <strong>Repositorio GitHub</strong> - Enlace directo a tu repositorio';
        } else {
            methodInfo = '<i class="fas fa-link"></i> <strong>📄 Enlace Directo</strong> - Para apuntes cortos';
        }

        return { url, methodInfo };
    }

    async generateShareUrl() {
        if (!this.currentNoteId) return '';
        const note = this.getNoteById(this.currentNoteId);
        const subject = this.getSubjectOfNote(this.currentNoteId);
        if (!note || !subject) return '';

        const shareData = {
            t: note.title,
            c: note.content,
            ty: note.type,
            s: subject.name,
            sc: subject.color,
            d: note.updatedAt,
            app: 'escriba',
            version: '1.0'
        };

        try {
            if (this.github && this.github.isAuthenticated) {
                const relativePath = `data/notes/${note.id}.json`;
                const repoUrl = `${window.location.origin}${window.location.pathname}?github=${this.github.username}/${this.github.repoName}/${relativePath}`;
                if (repoUrl.length < 2000) return repoUrl;
            }

            const gistUrl = await this.createGist(shareData);
            if (gistUrl) return gistUrl;

            return `${window.location.origin}${window.location.pathname}?share=${this.utf8ToBase64(JSON.stringify(shareData))}`;
        } catch (error) {
            console.error('Share URL generation failed:', error);
            return '';
        }
    }

    async createGist(shareData) {
        try {
            const gistData = {
                description: `📚 Escriba Note: ${shareData.t} (${shareData.s})`,
                public: true,
                files: {
                    "escriba-note.json": {
                        content: JSON.stringify(shareData, null, 2)
                    }
                }
            };

            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gistData)
            });

            if (response.ok) {
                const gist = await response.json();
                return `${window.location.origin}${window.location.pathname}?gist=${gist.id}`;
            }
        } catch (error) {
            console.error('Gist creation failed:', error);
        }
        return null;
    }

    generateQRCode(url) {
        const canvas = document.getElementById('qrCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&ecc=M&format=png&data=${encodeURIComponent(url)}`;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            ctx.clearRect(0, 0, 180, 180);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 180, 180);
            ctx.drawImage(img, 5, 5, 170, 170);
            ctx.strokeStyle = '#e9ecef';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, 178, 178);
        };
        img.src = qrApiUrl;
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
        const githubStatus = document.getElementById('githubStatus');
        const statusText = document.getElementById('githubStatusText');
        const statusIcon = githubStatus?.querySelector('i');
        const syncButtons = document.getElementById('syncButtons');
        const modalDisconnect = document.getElementById('disconnectGitHub');
        const settingsSyncStatus = document.getElementById('settingsSyncStatus');
        const settingsSyncButton = document.getElementById('settingsSyncButton');
        const cloudActions = document.getElementById('cloudActionsArea');

        if (!githubStatus || !statusText) return;

        githubStatus.classList.remove('connected', 'syncing', 'error', 'disconnected');

        if (statusIcon) {
            statusIcon.className = 'fab fa-github';
            if (status === 'syncing') statusIcon.className = 'fas fa-sync fa-spin';
            else if (status === 'error') statusIcon.className = 'fas fa-exclamation-circle';
        }

        switch (status) {
            case 'connected':
                githubStatus.classList.add('connected');
                statusText.textContent = this.github.username || 'Conectado';
                if (syncButtons) syncButtons.style.display = 'flex';
                if (modalDisconnect) modalDisconnect.style.display = 'flex';
                if (settingsSyncStatus) settingsSyncStatus.textContent = 'Conectado como ' + (this.github.username || 'usuario');
                if (settingsSyncButton) settingsSyncButton.style.display = 'none';
                if (cloudActions) cloudActions.style.display = 'block';
                this.setupAutoSync();
                break;
            case 'syncing':
                githubStatus.classList.add('syncing');
                statusText.textContent = 'Sincronizando...';
                if (syncButtons) syncButtons.style.display = 'flex';
                if (modalDisconnect) modalDisconnect.style.display = 'flex';
                if (cloudActions) cloudActions.style.display = 'block';
                break;
            case 'error':
                githubStatus.classList.add('error');
                statusText.textContent = 'Error';
                if (syncButtons) syncButtons.style.display = 'flex';
                if (modalDisconnect) modalDisconnect.style.display = 'flex';
                if (cloudActions) cloudActions.style.display = 'block';
                break;
            case 'disconnected':
            default:
                githubStatus.classList.add('disconnected');
                statusText.textContent = 'No conectado';
                if (syncButtons) syncButtons.style.display = 'none';
                if (modalDisconnect) modalDisconnect.style.display = 'none';
                if (settingsSyncStatus) settingsSyncStatus.textContent = 'No conectado a GitHub';
                if (settingsSyncButton) settingsSyncButton.style.display = 'flex';
                if (cloudActions) cloudActions.style.display = 'none';
                break;
        }
    }

    updateSettingsStats() {
        const countSubjects = document.getElementById('countSubjects');
        const countNotes = document.getElementById('countNotes');
        const countWords = document.getElementById('countWords');

        if (!countSubjects || !countNotes || !countWords) return;

        const subjectsCount = this.subjects.length;
        let notesCount = 0;
        let totalWords = 0;

        this.subjects.forEach(s => {
            notesCount += s.notes.length;
            s.notes.forEach(n => {
                const text = n.content.replace(/<[^>]*>/g, ' ');
                totalWords += text.trim().split(/\s+/).filter(w => w.length > 0).length;
            });
        });

        countSubjects.textContent = subjectsCount;
        countNotes.textContent = notesCount;
        countWords.textContent = totalWords.toLocaleString();
    }

    insertCodeBlock() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const selectedText = selection.toString().trim();
        const initialCode = selectedText || '// Escribí tu código acá';
        const aceId = `ace-${Date.now()}`;

        const html = `
            <div class="code-block-container" contenteditable="false">
                <div class="code-block-header">
                    <span class="code-block-title"><i class="fas fa-terminal"></i> Bloque de Código</span>
                    <div class="code-block-actions">
                        <button class="code-block-delete-btn" title="Eliminar bloque"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div id="${aceId}" class="inline-ace-editor"></div>
            </div>
            <p><br></p>
        `;

        document.execCommand('insertHTML', false, html);

        const editorElement = document.getElementById(aceId);
        if (editorElement) {
            initializeAceEditor(editorElement, initialCode);
        }

        this.debouncedSave();
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
                expanded: this.settings && typeof this.settings.expandSubjects !== 'undefined' ? this.settings.expandSubjects : true,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
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
            type: noteData.ty || 'lecture',
            mathMode: noteData.m || false
        };

        subject.notes.unshift(newNote);
        subject.lastModified = new Date().toISOString();
        saveSubjects(this.subjects);
        this.renderSubjects();
        this.loadNote(newNote.id);
        showToast('Apunte importado correctamente', 'success');
    }

    toggleInlineCode() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        let container = range.commonAncestorContainer;
        if (container.nodeType === Node.TEXT_NODE) container = container.parentElement;

        const codeElement = container.closest('code') ||
            (range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer.closest('code') : range.startContainer.parentElement?.closest('code')) ||
            (range.endContainer.nodeType === Node.ELEMENT_NODE ? range.endContainer.closest('code') : range.endContainer.parentElement?.closest('code'));

        if (codeElement) {
            const parent = codeElement.parentNode;
            if (!parent) return;

            const fragment = document.createDocumentFragment();
            const children = Array.from(codeElement.childNodes);
            children.forEach(child => fragment.appendChild(child));

            const firstChild = children[0];
            const lastChild = children[children.length - 1];

            parent.replaceChild(fragment, codeElement);

            if (firstChild && lastChild) {
                const newRange = document.createRange();
                newRange.setStartBefore(firstChild);
                newRange.setEndAfter(lastChild);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        } else {
            const code = document.createElement('code');
            code.className = 'inline-code';

            if (range.isCollapsed) {
                code.innerHTML = '&#8203;';
                range.insertNode(code);
                range.setStart(code, 1);
                range.collapse(true);
            } else {
                const content = range.extractContents();

                content.querySelectorAll('code').forEach(c => {
                    const frag = document.createDocumentFragment();
                    while (c.firstChild) frag.appendChild(c.firstChild);
                    c.parentNode.replaceChild(frag, c);
                });

                code.appendChild(content);
                range.insertNode(code);

                const newRange = document.createRange();
                newRange.selectNodeContents(code);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        }

        updateToolbarStates();
        this.debouncedSave();
    }

    toggleHighlight() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        let container = selection.getRangeAt(0).commonAncestorContainer;
        if (container.nodeType === Node.TEXT_NODE) container = container.parentElement;

        const isHighlighted = container.style.backgroundColor === 'rgb(255, 241, 118)' ||
            container.closest('[style*="background-color: rgb(255, 241, 118)"]') ||
            container.closest('mark');

        if (isHighlighted) {
            document.execCommand('backColor', false, 'inherit');
        } else {
            document.execCommand('backColor', false, '#fff176');
        }

        updateToolbarStates();
        this.debouncedSave();
    }

    toggleMathMode() {
        if (!this.currentNoteId) {
            showToast('Abrir un apunte primero', 'error');
            return;
        }

        const note = this.getNoteById(this.currentNoteId);
        if (note) {
            this.mathManager.toggle(note);
            this.saveCurrentNote();
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

    editUMLDiagram(btn) {
        const container = btn.closest('.uml-diagram-container');
        if (container) {
            const code = container.getAttribute('data-uml-code');
            const umlCodeInput = document.getElementById('umlCode');
            if (umlCodeInput) umlCodeInput.value = code || '';

            showModal('umlModal');
            container.remove();
            this.debouncedSave();

            const preview = document.getElementById('umlPreview');
            if (preview && code) updateUMLPreview({ getValue: () => code }, preview);
        }
    }

    deleteUMLDiagram(btn) {
        const container = btn.closest('.uml-diagram-container');
        if (container && confirm('¿Eliminar este diagrama?')) {
            container.remove();
            this.debouncedSave();
        }
    }

    exportNoteToMarkdown() {
        if (!this.currentNoteId) return;

        let foundNote = null;
        let foundSubject = null;
        this.subjects.forEach(s => {
            const note = s.notes.find(n => n.id === this.currentNoteId);
            if (note) {
                foundNote = note;
                foundSubject = s;
            }
        });

        if (!foundNote) return;

        const contentElement = document.getElementById('noteContent');
        const markdown = this.htmlToMarkdown(contentElement);
        const fullMarkdown = `# ${foundNote.title}\n\n*Materia: ${foundSubject.name}*\n*Fecha: ${formatDate(foundNote.updatedAt)}*\n\n---\n\n${markdown}`;

        const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        a.download = `${foundNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Apunte exportado como Markdown', 'success');
    }

    htmlToMarkdown(element) {
        let md = '';
        const children = element.childNodes;

        children.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                md += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();

                if (node.classList.contains('uml-diagram-container')) {
                    const code = node.getAttribute('data-uml-code');
                    md += `\n\n\`\`\`mermaid\n${code}\n\`\`\`\n\n`;
                    return;
                }

                if (node.classList.contains('math-toolbar') || node.classList.contains('katex-display')) {
                    return;
                }

                switch (tag) {
                    case 'b': case 'strong': md += `**${this.htmlToMarkdown(node)}**`; break;
                    case 'i': case 'em': md += `*${this.htmlToMarkdown(node)}*`; break;
                    case 'u': md += `<u>${this.htmlToMarkdown(node)}</u>`; break;
                    case 'h1': md += `\n# ${this.htmlToMarkdown(node)}\n`; break;
                    case 'h2': md += `\n## ${this.htmlToMarkdown(node)}\n`; break;
                    case 'h3': md += `\n### ${this.htmlToMarkdown(node)}\n`; break;
                    case 'p': md += `\n${this.htmlToMarkdown(node)}\n`; break;
                    case 'br': md += '\n'; break;
                    case 'ul': md += `\n${this.htmlToMarkdown(node)}\n`; break;
                    case 'ol': md += `\n${this.htmlToMarkdown(node)}\n`; break;
                    case 'li': md += `- ${this.htmlToMarkdown(node)}\n`; break;
                    case 'div': md += `\n${this.htmlToMarkdown(node)}\n`; break;
                    case 'code': md += `\`${node.textContent}\``; break;
                    case 'pre':
                        const codeBlock = node.querySelector('code');
                        md += `\n\`\`\`\n${codeBlock ? codeBlock.textContent : node.textContent}\n\`\`\`\n`;
                        break;
                    default: md += this.htmlToMarkdown(node); break;
                }
            }
        });

        // Clean up excessive newlines
        return md.replace(/\n{3,}/g, '\n\n').trim();
    }

    initFloatingToolbar() {
        if (!this.floatingToolbar) {
            this.floatingToolbar = document.getElementById('floatingToolbar');
        }
        if (!this.floatingToolbar) return;

        // Button clicks
        this.floatingToolbar.querySelectorAll('.floating-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const command = e.currentTarget.dataset.command;
                const id = e.currentTarget.id;

                if (command) {
                    document.execCommand(command, false, null);
                } else if (id === 'floatingHighlightBtn') {
                    this.toggleHighlight();
                } else if (id === 'floatingCodeBtn') {
                    this.toggleInlineCode();
                }

                updateToolbarStates();
                this.debouncedSave();

                // Keep selection and toolbar visible
                setTimeout(() => this.updateFloatingToolbar(), 10);
            });
        });

        document.addEventListener('selectionchange', () => {
            this.updateFloatingToolbar();
        });
    }

    updateFloatingToolbar() {
        if (!this.floatingToolbar) return;

        const selection = window.getSelection();
        const noteContent = document.getElementById('noteContent');

        if (!selection.rangeCount || selection.isCollapsed) {
            this.floatingToolbar.style.display = 'none';
            return;
        }

        const range = selection.getRangeAt(0);
        if (!noteContent || !noteContent.contains(range.commonAncestorContainer)) {
            this.floatingToolbar.style.display = 'none';
            return;
        }

        // Only show if there is non-whitespace text selected
        if (selection.toString().trim().length === 0) {
            this.floatingToolbar.style.display = 'none';
            return;
        }

        const rect = range.getBoundingClientRect();

        // Show temporarily to get dimensions
        this.floatingToolbar.style.display = 'flex';
        this.floatingToolbar.style.visibility = 'hidden';

        const toolbarRect = this.floatingToolbar.getBoundingClientRect();

        let top = rect.top - toolbarRect.height - 10;
        let left = rect.left + (rect.width / 2) - (toolbarRect.width / 2);

        // Keep within viewport
        if (top < 10) top = rect.bottom + 10;
        if (left < 10) left = 10;
        if (left + toolbarRect.width > window.innerWidth - 10) {
            left = window.innerWidth - toolbarRect.width - 10;
        }

        this.floatingToolbar.style.top = `${top}px`;
        this.floatingToolbar.style.left = `${left}px`;
        this.floatingToolbar.style.visibility = 'visible';
        this.floatingToolbar.style.opacity = '1';

        updateToolbarStates();
    }

    updateNoteStats() {
        const content = document.getElementById('noteContent');
        if (!content) return;

        const text = content.innerText || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const readingTime = Math.max(1, Math.ceil(words / 200));

        const wordEl = document.getElementById('wordCount');
        const charEl = document.getElementById('charCount');
        const timeEl = document.getElementById('readingTime');

        if (wordEl) wordEl.textContent = `${words} palabra${words !== 1 ? 's' : ''}`;
        if (charEl) charEl.textContent = `${chars} caractere${chars !== 1 ? 's' : ''}`;
        if (timeEl) timeEl.textContent = `${readingTime} min lectura`;
    }

    updateBacklinks(noteId) {
        const panel = document.getElementById('backlinksPanel');
        const list = document.getElementById('backlinksList');
        if (!panel || !list) return;

        const backlinks = [];
        this.subjects.forEach(s => {
            s.notes.forEach(n => {
                if (n.id === noteId || !n.content) return;
                if (n.content.includes(`data-note-id="${noteId}"`)) {
                    backlinks.push({ note: n, subject: s });
                }
            });
        });

        if (backlinks.length > 0) {
            panel.style.display = 'block';
            list.innerHTML = backlinks.map(bl => `
                <div class="backlink-item" data-note-id="${bl.note.id}" title="Ver apunte">
                    <div class="subject-icon" style="background: ${bl.subject.color}; width: 8px; height: 8px; border-radius: 50%;"></div>
                    <div class="backlink-info">
                        <span class="backlink-title">${escapeHtml(bl.note.title)}</span>
                        <span class="backlink-subject">${escapeHtml(bl.subject.name)}</span>
                    </div>
                    <i class="fas fa-chevron-right" style="margin-left: auto; font-size: 0.7rem; color: var(--text-muted);"></i>
                </div>
            `).join('');
        } else {
            panel.style.display = 'none';
        }
    }

    renderKnowledgeGraph() {
        const svg = document.getElementById('graphSvg');
        if (!svg) return;

        const width = svg.clientWidth || 800;
        const height = svg.clientHeight || 600;

        const nodes = [];
        const links = [];
        const noteToNode = new Map();

        this.subjects.forEach((s, sIdx) => {
            const subjectAngle = (sIdx / this.subjects.length) * Math.PI * 2;
            const subjectRadius = Math.min(width, height) * 0.35;

            s.notes.forEach((n, nIdx) => {
                const noteAngle = (nIdx / s.notes.length) * Math.PI * 2;
                const noteRadius = 40;

                const baseX = width / 2 + Math.cos(subjectAngle) * subjectRadius;
                const baseY = height / 2 + Math.sin(subjectAngle) * subjectRadius;

                const node = {
                    id: n.id,
                    title: n.title,
                    color: s.color,
                    x: baseX + Math.cos(noteAngle) * noteRadius + (Math.random() - 0.5) * 20,
                    y: baseY + Math.sin(noteAngle) * noteRadius + (Math.random() - 0.5) * 20,
                    vx: 0,
                    vy: 0
                };
                nodes.push(node);
                noteToNode.set(n.id, node);
            });
        });

        this.subjects.forEach(s => {
            s.notes.forEach(n => {
                const sourceNode = noteToNode.get(n.id);
                if (!sourceNode || !n.content) return;

                const regex = /data-note-id="([^"]+)"/g;
                let match;
                while ((match = regex.exec(n.content)) !== null) {
                    const targetNoteId = match[1];
                    const targetNode = noteToNode.get(targetNoteId);
                    if (targetNode && targetNode.id !== sourceNode.id) {
                        links.push({ source: sourceNode, target: targetNode });
                    }
                }
            });
        });

        if (!this.graphEngine) {
            this.graphEngine = new EscribaGraph(
                svg,
                (noteId) => {
                    hideModal('graphModal');
                    this.loadNote(noteId);
                }
            );
        }
        this.graphEngine.setData(nodes, links);
    }
}

class EscribaGraph {
    constructor(svg, onNodeClick) {
        this.svg = svg;
        this.onNodeClick = onNodeClick;
        this.viewport = svg.querySelector('#graphViewport');
        this.nodesGroup = svg.querySelector('#graphNodes');
        this.edgesGroup = svg.querySelector('#graphEdges');

        this.nodes = [];
        this.links = [];
        this.running = false;

        this.draggedNode = null;
        this.isPanning = false;
        this.panX = 0;
        this.panY = 0;
        this.scale = 1;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.initEvents();
    }

    setData(nodes, links) {
        this.nodes = nodes;
        this.links = links;
        this.render();
        if (!this.running) {
            this.running = true;
            this.animate();
        }
    }

    initEvents() {
        this.svg.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const nodeEl = e.target.closest('.graph-node');

            if (nodeEl) {
                const id = nodeEl.dataset.id;
                this.draggedNode = this.nodes.find(n => n.id === id);
                this.svg.style.cursor = 'grabbing';
            } else {
                this.isPanning = true;
                this.svg.style.cursor = 'move';
            }
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.draggedNode) {
                const dx = (e.clientX - this.lastMouseX) / this.scale;
                const dy = (e.clientY - this.lastMouseY) / this.scale;
                this.draggedNode.x += dx;
                this.draggedNode.y += dy;
            } else if (this.isPanning) {
                this.panX += e.clientX - this.lastMouseX;
                this.panY += e.clientY - this.lastMouseY;
                this.updateViewportTransform();
            }
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.draggedNode = null;
            this.isPanning = false;
            this.svg.style.cursor = 'grab';
        });

        this.svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.001;
            const delta = -e.deltaY;
            const newScale = Math.min(Math.max(this.scale + delta * zoomSpeed * this.scale, 0.1), 5);

            const rect = this.svg.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.panX -= (mouseX - this.panX) * (newScale / this.scale - 1);
            this.panY -= (mouseY - this.panY) * (newScale / this.scale - 1);

            this.scale = newScale;
            this.updateViewportTransform();
        }, { passive: false });

        this.svg.addEventListener('click', (e) => {
            e.stopPropagation();
            const nodeEl = e.target.closest('.graph-node');
            if (nodeEl && !this.isPanning && !this.draggedNode) {
                const id = nodeEl.dataset.id;
                this.onNodeClick(id);
            }
        });
    }

    updateViewportTransform() {
        if (this.viewport) {
            this.viewport.setAttribute('transform', `translate(${this.panX},${this.panY}) scale(${this.scale})`);
        }
    }

    render() {
        this.nodesGroup.innerHTML = '';
        this.edgesGroup.innerHTML = '';
        this.updateViewportTransform();

        this.nodes.forEach(n => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'graph-node');
            g.setAttribute('data-id', n.id);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', n.color);
            circle.setAttribute('stroke', 'rgba(255,255,255,0.2)');
            circle.setAttribute('stroke-width', '1');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('dy', '18');
            text.style.fontSize = '10px';
            text.style.fontWeight = '500';
            text.style.pointerEvents = 'none';
            text.style.userSelect = 'none';
            text.style.fill = 'var(--text-primary)';
            text.style.textAnchor = 'middle';
            text.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
            text.textContent = n.title.length > 20 ? n.title.substring(0, 17) + '...' : n.title;

            g.appendChild(circle);
            g.appendChild(text);
            this.nodesGroup.appendChild(g);
            n.el = g;
        });

        this.links.forEach(l => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'graph-edge');
            line.setAttribute('stroke', 'var(--border-color)');
            line.setAttribute('stroke-opacity', '0.4');
            line.setAttribute('stroke-width', '1.5');
            this.edgesGroup.appendChild(line);
            l.el = line;
        });
    }

    animate() {
        if (!this.running) return;

        const width = this.svg.clientWidth || 800;
        const height = this.svg.clientHeight || 600;

        const repulsion = 4000;
        const attraction = 0.05;
        const damping = 0.9;
        const restDistance = 140;

        for (let i = 0; i < this.nodes.length; i++) {
            const n1 = this.nodes[i];
            for (let j = i + 1; j < this.nodes.length; j++) {
                const n2 = this.nodes[j];
                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                const distSq = dx * dx + dy * dy + 0.1;
                const dist = Math.sqrt(distSq);

                if (dist < 500) {
                    const force = repulsion / distSq;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    n1.vx += fx;
                    n1.vy += fy;
                    n2.vx -= fx;
                    n2.vy -= fy;
                }
            }
        }

        this.links.forEach(l => {
            const dx = l.source.x - l.target.x;
            const dy = l.source.y - l.target.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            const force = (dist - restDistance) * attraction;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            l.source.vx -= fx;
            l.source.vy -= fy;
            l.target.vx += fx;
            l.target.vy += fy;
        });

        this.nodes.forEach(n => {
            n.vx += (width / 2 - n.x) * 0.005;
            n.vy += (height / 2 - n.y) * 0.005;
        });

        this.nodes.forEach(n => {
            if (n === this.draggedNode) {
                n.vx = 0;
                n.vy = 0;
            } else {
                n.x += n.vx;
                n.y += n.vy;
                n.vx *= damping;
                n.vy *= damping;
            }

            if (n.el) {
                n.el.setAttribute('transform', `translate(${n.x},${n.y})`);
            }
        });

        this.links.forEach(l => {
            if (l.el) {
                l.el.setAttribute('x1', l.source.x);
                l.el.setAttribute('y1', l.source.y);
                l.el.setAttribute('x2', l.target.x);
                l.el.setAttribute('y2', l.target.y);
            }
        });

        requestAnimationFrame(() => this.animate());
    }

}

const app = new EscribaApp();
window.cuaderno = app;
document.addEventListener('DOMContentLoaded', () => app.init());

export default app;
