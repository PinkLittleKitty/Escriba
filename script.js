class CuadernoDigital {
    constructor() {
        const rawSubjects = localStorage.getItem('cuadernoDigital');
        const rawEvents = localStorage.getItem('cuadernoEvents');
        
        this.subjects = rawSubjects ? this.validateAndCleanStoredData(JSON.parse(rawSubjects)) : [];
        this.events = rawEvents ? this.validateAndCleanStoredEvents(JSON.parse(rawEvents)) : [];
        
        this.currentNoteId = null;
        this.currentView = 'subjects';
        this.selectedColor = '#3b82f6';
        this.autoSaveInterval = null;
        this.currentDate = new Date();
        this.currentEventId = null;
        this.codeEditor = null;
    }

    validateAndCleanStoredData(subjects) {
        if (!Array.isArray(subjects)) return [];
        
        return subjects.map(subject => ({
            ...subject,
            name: this.sanitizeText(subject.name || 'Materia sin nombre'),
            code: subject.code ? this.sanitizeText(subject.code) : subject.code,
            professor: subject.professor ? this.sanitizeText(subject.professor) : subject.professor,
            notes: Array.isArray(subject.notes) ? subject.notes.map(note => ({
                ...note,
                title: this.sanitizeText(note.title || 'Apunte sin título'),
                content: this.cleanNoteContent(note.content || '')
            })) : []
        }));
    }

    validateAndCleanStoredEvents(events) {
        if (!Array.isArray(events)) return [];
        
        return events.map(event => ({
            ...event,
            title: this.sanitizeText(event.title || 'Evento sin título'),
            notes: event.notes ? this.sanitizeText(event.notes) : event.notes
        }));
    }

    async init() {
        document.body.classList.add('loading');

        this.bindEvents();
        this.loadSettings();

        if (window.githubSync) {
            await this.initializeGitHubSync();
        }

        await this.checkForSharedNote();

        this.renderSubjects();

        if (this.subjects.length === 0 && !this.isViewingSharedNote) {
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

        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        const mobileOverlay = document.getElementById('mobileOverlay');
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => this.closeMobileMenu());
        }

        document.querySelector('.dropdown-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.dropdown').classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-menu')) {
                document.querySelector('.dropdown').classList.remove('active');
            }
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            document.querySelector('.dropdown').classList.remove('active');
            this.exportCarpeta();
        });
        document.getElementById('importBtn').addEventListener('click', () => {
            document.querySelector('.dropdown').classList.remove('active');
            this.importCarpeta();
        });
        document.getElementById('importJsonBtn').addEventListener('click', () => {
            document.querySelector('.dropdown').classList.remove('active');
            this.importJsonNote();
        });
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.querySelector('.dropdown').classList.remove('active');
            this.showSettingsModal();
        });
        document.getElementById('printBtn').addEventListener('click', () => {
            document.querySelector('.dropdown').classList.remove('active');
            this.printCurrentNote();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));
        document.getElementById('importJsonFile').addEventListener('change', (e) => this.handleJsonImport(e));

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

        if (document.getElementById('syncButton')) {
            document.getElementById('syncButton').addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector('.dropdown').classList.remove('active');
                this.handleGitHubAuth();
            });
        }
        
        if (document.getElementById('githubStatus')) {
            document.getElementById('githubStatus').addEventListener('click', () => {
                this.handleGitHubAuth();
            });
        }
        
        if (document.getElementById('settingsSyncButton')) {
            document.getElementById('settingsSyncButton').addEventListener('click', () => this.handleGitHubAuth());
        }
        
        if (document.getElementById('pullButton')) {
            document.getElementById('pullButton').addEventListener('click', () => this.handleForcePull());
        }
        
        if (document.getElementById('pushButton')) {
            document.getElementById('pushButton').addEventListener('click', () => this.handleForcePush());
        }
        
        if (document.getElementById('disconnectGitHub')) {
            document.getElementById('disconnectGitHub').addEventListener('click', () => this.disconnectGitHub());
        }

        document.getElementById('cancelSubjectPicker').addEventListener('click', () => this.hideSubjectPickerModal());
        document.getElementById('cancelShare').addEventListener('click', () => this.hideShareModal());
        document.getElementById('copyUrlBtn').addEventListener('click', () => this.copyShareUrl());
        document.getElementById('shareWhatsApp').addEventListener('click', () => this.shareToWhatsApp());
        document.getElementById('shareEmail').addEventListener('click', () => this.shareToEmail());
        document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportCurrentNoteAsJson());

        document.getElementById('addEventBtn').addEventListener('click', () => this.showEventModal());
        document.getElementById('saveEvent').addEventListener('click', () => this.saveEvent());
        document.getElementById('cancelEvent').addEventListener('click', () => this.hideEventModal());
        document.getElementById('deleteEvent').addEventListener('click', () => this.deleteEvent());
        document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());

        document.getElementById('createLink').addEventListener('click', () => this.createInternalLink());
        document.getElementById('cancelLink').addEventListener('click', () => this.hideLinkModal());
        document.getElementById('linkSearchInput').addEventListener('input', (e) => this.searchNotesForLink(e.target.value));



        document.querySelectorAll('#settingsModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideSettingsModal());
        });

        document.querySelectorAll('#subjectPickerModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideSubjectPickerModal());
        });

        document.querySelectorAll('#shareModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideShareModal());
        });

        document.querySelectorAll('#eventModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideEventModal());
        });

        document.querySelectorAll('#linkModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideLinkModal());
        });

        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
        });

        document.getElementById('noteTitle').addEventListener('input', () => this.debouncedSave());
        document.getElementById('noteContent').addEventListener('input', () => this.debouncedSave());
        document.getElementById('noteTypeSelect').addEventListener('change', (e) => {
            this.handleNoteTypeChange(e.target.value);
            this.saveCurrentNote();
        });
        document.getElementById('noteLanguageSelect').addEventListener('change', (e) => this.setNoteLanguage(e.target.value));
        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('shareNoteBtn').addEventListener('click', () => this.showShareModal());

        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.target.closest('.toolbar-btn').dataset.command;
                if (command) {
                    this.formatText(command);
                }
            });
        });

        document.getElementById('highlightBtn').addEventListener('click', () => this.highlightText());
        document.getElementById('inlineCodeBtn').addEventListener('click', () => this.toggleInlineCode());
        document.getElementById('insertCodeBtn').addEventListener('click', () => this.insertCodeBlock());
        document.getElementById('insertLinkBtn').addEventListener('click', () => this.showLinkModal());
        document.getElementById('mathModeBtn').addEventListener('click', () => this.toggleMathMode());

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        this.autoSaveInterval = setInterval(() => {
            if (this.currentNoteId) {
                this.saveCurrentNote(true);
            }
        }, 2000);

        document.addEventListener('selectionchange', () => {
            const noteContent = document.getElementById('noteContent');
            const selection = window.getSelection();
            
            if (selection.rangeCount > 0 && noteContent) {
                const range = selection.getRangeAt(0);
                if (noteContent.contains(range.commonAncestorContainer) || 
                    noteContent === range.commonAncestorContainer) {
                    this.updateToolbarStates();
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            const noteContent = document.getElementById('noteContent');
            if (noteContent && noteContent.contains(e.target)) {
                setTimeout(() => this.updateToolbarStates(), 10);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSubjectModal();
                this.hideSettingsModal();
                this.hideSubjectPickerModal();
                this.hideShareModal();
                this.hideEventModal();
                this.hideLinkModal();
                this.closeMobileMenu();
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

    insertCodeBlock() {
        const noteContent = document.getElementById('noteContent');
        
        if (!noteContent.contains(document.activeElement)) {
            noteContent.focus();
        }

        const editorContainer = document.createElement('div');
        editorContainer.className = 'inline-ace-editor';
        editorContainer.id = `aceEditor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        editorContainer.setAttribute('data-initialized', 'false');

        const selection = window.getSelection();
        let insertPosition = null;

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            if (noteContent.contains(range.commonAncestorContainer)) {
                insertPosition = range;
            }
        }

        if (insertPosition) {
            insertPosition.deleteContents();
            
            const beforeText = document.createTextNode('\n');
            insertPosition.insertNode(beforeText);
            insertPosition.setStartAfter(beforeText);
            
            insertPosition.insertNode(editorContainer);
            insertPosition.setStartAfter(editorContainer);
            
            const afterText = document.createTextNode('\n');
            insertPosition.insertNode(afterText);
            
        } else {
            noteContent.appendChild(document.createElement('br'));
            noteContent.appendChild(editorContainer);
            noteContent.appendChild(document.createElement('br'));
        }

        setTimeout(() => {
            this.initializeAceEditor(editorContainer);
            setTimeout(() => {
                this.updateLanguageSelectVisibility();
            }, 100);
        }, 50);
    }

    initializeAceEditor(editorContainer, initialCode = '') {
        if (!editorContainer || editorContainer.getAttribute('data-initialized') === 'true') {
            console.warn('Editor container already initialized or not found');
            return null;
        }

        try {
            editorContainer.setAttribute('data-initialized', 'initializing');
            
            const currentLanguage = this.getCurrentNoteLanguage();
            
            if (editorContainer.aceEditor) {
                editorContainer.aceEditor.destroy();
                editorContainer.aceEditor = null;
            }

            editorContainer.innerHTML = '';
            
            editorContainer.style.height = '80px';
            editorContainer.style.minHeight = '80px';
            editorContainer.style.position = 'relative';
            editorContainer.style.overflow = 'hidden';

            const editor = ace.edit(editorContainer.id);
            
            editor.setTheme(this.getCurrentTheme());
            editor.session.setMode(this.getAceModeForLanguage(currentLanguage));
            
            editor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
                fontSize: 14,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                showPrintMargin: false,
                wrap: true,
                useWorker: false,
                maxLines: 25,
                minLines: 3,
                autoScrollEditorIntoView: false,
                scrollPastEnd: 0,
                behavioursEnabled: true,
                wrapBehavioursEnabled: true,
                highlightActiveLine: true,
                showGutter: true,
                displayIndentGuides: true,
                cursorStyle: 'ace',
                mergeUndoDeltas: true,
                animatedScroll: false,
                tabSize: 4,
                useSoftTabs: true
            });

            if (initialCode) {
                editor.setValue(initialCode, -1);
            }

            editorContainer.aceEditor = editor;
            editorContainer.setAttribute('data-language', currentLanguage);

            this.setupCodeEditorEvents(editor, editorContainer);
            
            this.setupCodeEditorKeyboard(editor, editorContainer);

            this.setupAutoResize(editor, editorContainer);

            setTimeout(() => {
                try {
                    editor.resize(true);
                    
                    if (!initialCode) {
                        editor.focus();
                    }
                    
                    editorContainer.setAttribute('data-initialized', 'true');
                    
                    this.updateEditorHeight(editor, editorContainer);
                    
                } catch (resizeError) {
                    console.warn('Error in editor final setup:', resizeError);
                }
            }, 100);

            return editor;

        } catch (error) {
            console.error('Error initializing ACE editor:', error);
            editorContainer.setAttribute('data-initialized', 'error');
            
            editorContainer.innerHTML = `
                <div style="padding: 1rem; background: var(--bg-tertiary); color: var(--text-secondary); 
                           border-radius: 4px; text-align: center;">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar editor de código
                    <br><small>Intentá recargar la página</small>
                </div>`;
            
            return null;
        }
    }

    setupCodeEditorKeyboard(editor, editorContainer) {
        editor.commands.addCommand({
            name: 'deleteCodeBlock',
            bindKey: { win: 'Ctrl-Backspace', mac: 'Cmd-Backspace' },
            exec: () => {
                this.deleteCodeBlock(editorContainer);
            }
        });

        editor.commands.addCommand({
            name: 'smartBackspace',
            bindKey: { win: 'Backspace', mac: 'Backspace' },
            exec: (editor) => {
                const cursor = editor.getCursorPosition();
                const session = editor.getSession();

                if (cursor.row === 0 && cursor.column === 0) {
                    const content = session.getValue().trim();
                    if (content === '') {
                        this.deleteCodeBlock(editorContainer);
                        return;
                    }
                }

                editor.execCommand('backspace');
            }
        });

        editor.commands.addCommand({
            name: 'exitCodeEditor',
            bindKey: { win: 'Escape', mac: 'Escape' },
            exec: () => {
                const noteContent = document.getElementById('noteContent');
                const range = document.createRange();
                const selection = window.getSelection();
                
                let nextSibling = editorContainer.nextSibling;
                if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE) {
                    const lineBreak = document.createElement('br');
                    editorContainer.parentNode.insertBefore(lineBreak, nextSibling);
                    nextSibling = lineBreak;
                }
                
                range.setStartAfter(editorContainer);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                
                noteContent.focus();
            }
        });

        const noteContent = document.getElementById('noteContent');
        
        editor.on('focus', () => {
            noteContent.currentFocusedEditor = editor;
        });

        editor.on('blur', () => {
            if (noteContent.currentFocusedEditor === editor) {
                noteContent.currentFocusedEditor = null;
            }
        });
    }

    setupCodeEditorEvents(editor, editorContainer) {
        const noteContent = document.getElementById('noteContent');
        
        editor.on('focus', () => {
            noteContent.currentFocusedEditor = editor;
            editorContainer.classList.add('ace-focused');
        });

        editor.on('blur', () => {
            if (noteContent.currentFocusedEditor === editor) {
                noteContent.currentFocusedEditor = null;
            }
            editorContainer.classList.remove('ace-focused');
        });

        let changeTimeout;
        editor.session.on('change', () => {
            clearTimeout(changeTimeout);
            changeTimeout = setTimeout(() => {
                this.debouncedSave();
            }, 300);
            
            this.updateEditorHeight(editor, editorContainer);
        });

        editor.on('changeStatus', () => {
            if (editor.renderer) {
                editor.resize(true);
            }
        });

        const handleClickOutsideEditor = (e) => {
            if (!editorContainer.contains(e.target) && noteContent.currentFocusedEditor === editor) {
                if (noteContent.contains(e.target)) {
                    noteContent.focus();
                }
            }
        };

        editorContainer._clickHandler = handleClickOutsideEditor;
        document.addEventListener('click', handleClickOutsideEditor);
    }

    deleteCodeBlock(editorContainer) {
        if (confirm('¿Eliminar este bloque de código?')) {
            if (editorContainer.aceEditor) {
                try {
                    editorContainer.aceEditor.destroy();
                } catch (error) {
                    console.warn('Error destroying editor during delete:', error);
                }
                editorContainer.aceEditor = null;
            }
            
            if (editorContainer._resizeObserver) {
                editorContainer._resizeObserver.disconnect();
                editorContainer._resizeObserver = null;
            }

            if (editorContainer._clickHandler) {
                document.removeEventListener('click', editorContainer._clickHandler);
                editorContainer._clickHandler = null;
            }

            const noteContent = document.getElementById('noteContent');
            if (noteContent.currentFocusedEditor === editorContainer.aceEditor) {
                noteContent.currentFocusedEditor = null;
            }

            const range = document.createRange();
            const selection = window.getSelection();
            
            try {
                range.setStartAfter(editorContainer);
                range.collapse(true);
                
                const nextNode = editorContainer.nextSibling;
                if (!nextNode || nextNode.nodeName !== 'BR') {
                    const br = document.createElement('br');
                    editorContainer.parentNode.insertBefore(br, nextNode);
                }
                
                selection.removeAllRanges();
                selection.addRange(range);
                
            } catch (error) {
                console.warn('Error positioning cursor after delete:', error);
            }

            editorContainer.remove();
            
            noteContent.focus();
            
            this.saveCurrentNote();
            this.showToast('Bloque de código eliminado', 'success');
            
            this.updateLanguageSelectVisibility();
        }
    }

    setupAutoResize(editor, editorContainer) {
        editorContainer._resizeHandler = () => this.updateEditorHeight(editor, editorContainer);
        
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                if (editor.renderer) {
                    editor.resize(true);
                }
            });
            resizeObserver.observe(editorContainer);
            editorContainer._resizeObserver = resizeObserver;
        }

        setTimeout(() => {
            this.updateEditorHeight(editor, editorContainer);
        }, 100);
    }

    updateEditorHeight(editor, editorContainer) {
        if (!editor || !editor.renderer || !editorContainer) {
            return;
        }

        try {
            if (editorContainer.classList.contains('ace-resizing')) {
                return;
            }

            editorContainer.classList.add('ace-resizing');

            const session = editor.getSession();
            if (!session) return;

            const lines = session.getLength();
            const lineHeight = editor.renderer.lineHeight || 18;
            const gutterWidth = editor.renderer.gutterWidth || 0;
            
            const minHeight = Math.max(80, 3 * lineHeight + 20);
            const maxHeight = Math.min(500, window.innerHeight * 0.5);
            
            let desiredHeight = Math.max(minHeight, lines * lineHeight + 40);
            desiredHeight = Math.min(desiredHeight, maxHeight);

            const currentHeight = parseInt(editorContainer.style.height) || 0;
            if (Math.abs(currentHeight - desiredHeight) > 5) {
                editorContainer.style.height = desiredHeight + 'px';
                
                setTimeout(() => {
                    if (editor.renderer) {
                        editor.resize(true);
                        editor.renderer.updateFull();
                    }
                }, 10);
            }

        } catch (error) {
            console.warn('Error updating editor height:', error);
        } finally {
            setTimeout(() => {
                editorContainer.classList.remove('ace-resizing');
            }, 100);
        }
    }

    serializeNoteContent() {
        const noteContent = document.getElementById('noteContent');
        const clone = noteContent.cloneNode(true);

        const aceEditors = clone.querySelectorAll('.inline-ace-editor');
        aceEditors.forEach(editorContainer => {
            const originalEditor = document.getElementById(editorContainer.id);
            if (originalEditor && originalEditor.aceEditor) {
                const code = originalEditor.aceEditor.getValue();
                const language = originalEditor.getAttribute('data-language') || 'javascript';

                const placeholder = document.createElement('div');
                placeholder.className = 'ace-editor-placeholder';
                placeholder.setAttribute('data-code', code);
                placeholder.setAttribute('data-language', language);
                placeholder.textContent = `[Code Editor: ${language}]`;

                editorContainer.parentNode.replaceChild(placeholder, editorContainer);
            }
        });

        return clone.innerHTML;
    }

    restoreNoteContent(content) {
        const noteContent = document.getElementById('noteContent');
        
        this.cleanupExistingEditors();
        
        noteContent.innerHTML = content;

        const placeholders = noteContent.querySelectorAll('.ace-editor-placeholder');
        
        if (placeholders.length === 0) {
            return;
        }

        let delay = 0;
        placeholders.forEach((placeholder, index) => {
            setTimeout(() => {
                this.restoreSingleEditor(placeholder);
            }, delay);
            delay += 100;
        });

        setTimeout(() => {
            this.updateLanguageSelectVisibility();
        }, delay + 100);
    }

    cleanupExistingEditors() {
        const noteContent = document.getElementById('noteContent');
        const existingEditors = noteContent.querySelectorAll('.inline-ace-editor');
        
        existingEditors.forEach(container => {
            if (container.aceEditor) {
                try {
                    container.aceEditor.destroy();
                } catch (error) {
                    console.warn('Error destroying editor:', error);
                }
                container.aceEditor = null;
            }
            
            if (container._resizeObserver) {
                container._resizeObserver.disconnect();
                container._resizeObserver = null;
            }

            if (container._clickHandler) {
                document.removeEventListener('click', container._clickHandler);
                container._clickHandler = null;
            }
        });
    }

    restoreSingleEditor(placeholder) {
        try {
            const code = placeholder.getAttribute('data-code') || '';
            const language = placeholder.getAttribute('data-language') || 'javascript';

            const editorContainer = document.createElement('div');
            editorContainer.className = 'inline-ace-editor';
            editorContainer.id = `aceEditor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            placeholder.parentNode.replaceChild(editorContainer, placeholder);

            setTimeout(() => {
                const editor = this.initializeAceEditor(editorContainer, code);
                
                if (editor && editorContainer.aceEditor) {
                    editor.session.setMode(this.getAceModeForLanguage(language));
                    editorContainer.setAttribute('data-language', language);
                    
                    setTimeout(() => {
                        if (code) {
                            editor.setValue(code, -1);
                            editor.clearSelection();
                        }
                        this.updateEditorHeight(editor, editorContainer);
                    }, 50);
                }
            }, 10);

        } catch (error) {
            console.error('Error restoring editor:', error);
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'ace-editor-placeholder';
            errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error al restaurar editor de código`;
            placeholder.parentNode.replaceChild(errorDiv, placeholder);
        }
    }

    getCurrentNoteLanguage() {
        if (this.currentNoteId) {
            let note = null;
            for (const subject of this.subjects) {
                const foundNote = subject.notes.find(n => n.id === this.currentNoteId);
                if (foundNote) {
                    note = foundNote;
                    break;
                }
            }
            if (note && note.codeLanguage) {
                return note.codeLanguage;
            }
        }
        return 'javascript';
    }

    setNoteLanguage(language) {
        if (!this.currentNoteId) return;

        let note = null;
        for (const subject of this.subjects) {
            const foundNote = subject.notes.find(n => n.id === this.currentNoteId);
            if (foundNote) {
                note = foundNote;
                break;
            }
        }

        if (note) {
            note.codeLanguage = language;
            this.saveCarpeta();

            const languageSelect = document.getElementById('noteLanguageSelect');
            if (languageSelect) {
                languageSelect.value = language;
            }

            this.updateAllEditorsLanguage(language);

            this.showToast(`Lenguaje de código cambiado a ${language}`, 'success');
        }
    }

    updateAllEditorsLanguage(language) {
        const noteContent = document.getElementById('noteContent');
        const editors = noteContent.querySelectorAll('.inline-ace-editor');
        
        editors.forEach(editorContainer => {
            if (editorContainer.aceEditor) {
                try {
                    editorContainer.aceEditor.session.setMode(this.getAceModeForLanguage(language));
                    editorContainer.setAttribute('data-language', language);
                } catch (error) {
                    console.warn('Error updating editor language:', error);
                }
            }
        });
    }

    getCurrentTheme() {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        return theme === 'light' ? 'ace/theme/github' : 'ace/theme/tomorrow_night';
    }

    getAceModeForLanguage(language) {
        const modes = {
            'javascript': 'ace/mode/javascript',
            'python': 'ace/mode/python',
            'html': 'ace/mode/html',
            'css': 'ace/mode/css',
            'json': 'ace/mode/json',
            'markdown': 'ace/mode/markdown',
            'text': 'ace/mode/text'
        };
        return modes[language] || 'ace/mode/text';
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

    async initializeGitHubSync() {
        if (!window.githubSync) return;

        this.updateGitHubSyncUI();

        this.setupAutoSync();
    }

    async performInitialSync() {
        if (!window.githubSync || !window.githubSync.isAuthenticated) return;

        try {
            const result = await window.githubSync.syncData(
                this.subjects,
                this.events,
                this.getAppSettings()
            );

            if (result) {
                this.subjects = result.subjects;
                this.events = result.events;
                this.saveCarpeta();
                this.renderSubjects();
                this.showToast('Datos sincronizados desde GitHub', 'success');
            }
        } catch (error) {
            console.error('Initial sync failed:', error);
            this.showToast('Error en la sincronización inicial', 'error');
        }
    }

    updateGitHubSyncUI() {
        if (!window.githubSync) return;

        const syncStatus = document.getElementById('syncStatus');
        const settingsSyncStatus = document.getElementById('settingsSyncStatus');
        const settingsSyncButton = document.getElementById('settingsSyncButton');
        const disconnectButton = document.getElementById('disconnectGitHub');

        if (window.githubSync.isAuthenticated) {
            const lastSync = window.githubSync.lastSyncTime ?
                new Date(window.githubSync.lastSyncTime).toLocaleString() :
                'Nunca';

            const statusText = `Conectado como ${window.githubSync.username}`;
            const fullStatusText = `${statusText} • Última sync: ${lastSync}`;

            if (syncStatus) syncStatus.textContent = fullStatusText;
            if (settingsSyncStatus) settingsSyncStatus.textContent = statusText;

            if (settingsSyncButton) {
                settingsSyncButton.innerHTML = '<i class="fas fa-sync"></i> Sincronizar Ahora';
                settingsSyncButton.onclick = () => this.triggerManualSync();
            }

            if (disconnectButton) {
                disconnectButton.style.display = 'block';
            }
        } else {
            if (syncStatus) syncStatus.textContent = 'No conectado';
            if (settingsSyncStatus) settingsSyncStatus.textContent = 'No conectado a GitHub';

            if (settingsSyncButton) {
                settingsSyncButton.innerHTML = '<i class="fab fa-github"></i> Conectar GitHub';
                settingsSyncButton.onclick = () => this.handleGitHubAuth();
            }

            if (disconnectButton) {
                disconnectButton.style.display = 'none';
            }
        }

        window.githubSync.updateSyncUI();
        
        if (window.githubSync.updateSyncButtons) {
            window.githubSync.updateSyncButtons();
        }
    }

    handleGitHubAuth() {
        if (!window.githubSync) return;

        if (window.githubSync.isAuthenticated) {
            this.triggerManualSync();
        } else {
            window.githubSync.authenticate();
        }
    }

    async triggerManualSync() {
        if (!window.githubSync || !window.githubSync.isAuthenticated) {
            this.showToast('No estás conectado a GitHub', 'error');
            return;
        }

        try {
            const result = await window.githubSync.syncData(
                this.subjects,
                this.events,
                this.getAppSettings()
            );

            if (result) {
                this.subjects = result.subjects;
                this.events = result.events;
                this.saveCarpeta();
                this.renderSubjects();
                this.updateGitHubSyncUI();
            }
        } catch (error) {
            console.error('Manual sync failed:', error);
        }
    }

    disconnectGitHub() {
        if (!window.githubSync) return;

        if (confirm('¿Estás seguro de que querés desconectar GitHub? Los datos locales se mantendrán.')) {
            window.githubSync.logout();
            this.updateGitHubSyncUI();
            this.showToast('Desconectado de GitHub', 'success');
        }
    }

    async handleForcePull() {
        if (!window.githubSync || !window.githubSync.isAuthenticated) {
            this.showToast('No estás conectado a GitHub', 'error');
            return;
        }

        const confirmMessage = '¿Estás seguro de que querés descargar los datos desde GitHub?\n\n' +
                              '⚠️ ATENCIÓN: Esto sobrescribirá todos tus datos locales con los datos de GitHub.\n' +
                              'Los datos locales actuales se perderán permanentemente.';
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const success = await window.githubSync.forcePull();
            if (success) {
                const rawSubjects = localStorage.getItem('cuadernoDigital');
                const rawEvents = localStorage.getItem('cuadernoEvents');
                
                this.subjects = rawSubjects ? this.validateAndCleanStoredData(JSON.parse(rawSubjects)) : [];
                this.events = rawEvents ? this.validateAndCleanStoredEvents(JSON.parse(rawEvents)) : [];
                
                this.renderSubjects();
                this.updateGitHubSyncUI();
                
                if (this.currentView !== 'subjects') {
                    this.switchView(this.currentView);
                }
            }
        } catch (error) {
            console.error('Force pull failed:', error);
            this.showToast('Error al descargar datos desde GitHub', 'error');
        }
    }

    async handleForcePush() {
        if (!window.githubSync || !window.githubSync.isAuthenticated) {
            this.showToast('No estás conectado a GitHub', 'error');
            return;
        }

        const confirmMessage = '¿Estás seguro de que querés subir tus datos locales a GitHub?\n\n' +
                              '⚠️ ATENCIÓN: Esto sobrescribirá todos los datos en GitHub con tus datos locales.\n' +
                              'Los datos remotos actuales se perderán permanentemente.';
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const success = await window.githubSync.forcePush();
            if (success) {
                this.updateGitHubSyncUI();
            }
        } catch (error) {
            console.error('Force push failed:', error);
            this.showToast('Error al subir datos a GitHub', 'error');
        }
    }

    setupAutoSync() {
        const autoSyncEnabled = localStorage.getItem('autoSync') !== 'false';

        if (autoSyncEnabled && window.githubSync && window.githubSync.isAuthenticated) {
            setInterval(() => {
                if (window.githubSync.isAuthenticated && !window.githubSync.syncInProgress) {
                    this.triggerManualSync();
                }
            }, 5 * 60 * 1000);
        }
    }

    getAppSettings() {
        return {
            theme: document.documentElement.getAttribute('data-theme') || 'dark',
            fontSize: getComputedStyle(document.documentElement).getPropertyValue('--font-size') || '16px',
            fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-family') || 'Inter',
            autoSave: document.getElementById('autoSave')?.checked ?? true,
            expandSubjects: document.getElementById('expandSubjects')?.checked ?? true,
            showWelcome: document.getElementById('showWelcome')?.checked ?? true,
            autoSync: document.getElementById('autoSync')?.checked ?? true
        };
    }

    utf8ToBase64(str) {
        try {
            const bytes = new TextEncoder().encode(str);
            let binary = '';
            bytes.forEach(byte => binary += String.fromCharCode(byte));
            return btoa(binary);
        } catch (error) {
            console.error('Error encoding to base64:', error);
            return btoa(unescape(encodeURIComponent(str)));
        }
    }

    base64ToUtf8(str) {
        try {
            const binary = atob(str);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return new TextDecoder().decode(bytes);
        } catch (error) {
            console.error('Error decoding from base64:', error);
            try {
                return decodeURIComponent(escape(atob(str)));
            } catch (fallbackError) {
                console.error('Fallback decoding also failed:', fallbackError);
                return str;
            }
        }
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

    showSubjectPickerModal() {
        const modal = document.getElementById('subjectPickerModal');
        const listContainer = document.getElementById('subjectPickerList');

        listContainer.innerHTML = this.subjects.map(subject => `
            <div class="subject-picker-item" data-subject-id="${subject.id}">
                <div class="subject-picker-icon" style="background: ${subject.color}"></div>
                <div class="subject-picker-info">
                    <div class="subject-picker-name">${this.escapeHtml(subject.name)}</div>
                    <div class="subject-picker-details">
                        ${subject.code ? `<span class="subject-picker-code">${this.escapeHtml(subject.code)}</span>` : ''}
                        ${subject.professor ? `<span>Prof. ${this.escapeHtml(subject.professor)}</span>` : ''}
                        <span class="subject-picker-count">${subject.notes.length} apuntes</span>
                    </div>
                </div>
            </div>
        `).join('');

        listContainer.querySelectorAll('.subject-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                const subjectId = item.dataset.subjectId;
                this.hideSubjectPickerModal();
                this.createNoteInSubject(subjectId);
            });
        });

        modal.classList.add('active');
    }

    hideSubjectPickerModal() {
        document.getElementById('subjectPickerModal').classList.remove('active');
    }

    async showShareModal() {
        if (!this.currentNoteId) {
            this.showToast('No hay ningún apunte abierto para compartir', 'error');
            return;
        }

        document.getElementById('shareModal').classList.add('active');
        document.getElementById('shareUrl').value = 'Generando enlace...';
        document.getElementById('shareMethodInfo').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando enlace...';

        const canvas = document.getElementById('qrCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 200, 200);
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = '#6c757d';
        ctx.font = '14px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Generando enlace...', 100, 100);

        try {
            const result = await this.generateShareUrlWithInfo();
            document.getElementById('shareUrl').value = result.url;
            document.getElementById('shareMethodInfo').innerHTML = result.methodInfo;
            this.generateQRCode(result.url);
        } catch (error) {
            console.error('Error generating share URL:', error);
            document.getElementById('shareUrl').value = 'Error al generar enlace';
            document.getElementById('shareMethodInfo').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error al generar enlace';
            this.showToast('Error al generar enlace para compartir', 'error');
        }
    }

    hideShareModal() {
        document.getElementById('shareModal').classList.remove('active');
    }

    async generateShareUrlWithInfo() {
        const url = await this.generateShareUrl();
        let methodInfo = '';

        if (url.includes('gist=')) {
            methodInfo = '<i class="fas fa-github"></i> Enlace optimizado via GitHub Gist';
        } else if (url.includes('truncated')) {
            methodInfo = '<i class="fas fa-exclamation-triangle text-warning"></i> Contenido truncado para URL - Usá "Exportar como JSON" para el contenido completo';
        } else {
            methodInfo = '<i class="fas fa-link"></i> Enlace directo (Si el apunte es largo no va a funcar, Usá "Exportar como JSON" para el contenido completo)';
        }

        return { url, methodInfo };
    }

    async generateShareUrl() {
        if (!this.currentNoteId) return '';

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
            const gistUrl = await this.createGist(shareData);
            if (gistUrl) {
                return gistUrl;
            }

            const jsonString = JSON.stringify(shareData);
            if (jsonString.length < 1500) {
                const encodedData = this.utf8ToBase64(jsonString);
                return `${window.location.origin}${window.location.pathname}?share=${encodedData}`;
            }

            const truncatedData = {
                ...shareData,
                c: shareData.c.substring(0, 800) + '\n\n[Nota: Contenido truncado para compartir. Para el contenido completo, exporta como JSON.]',
                truncated: true
            };

            const truncatedJson = JSON.stringify(truncatedData);
            const encodedData = this.utf8ToBase64(truncatedJson);
            return `${window.location.origin}${window.location.pathname}?share=${encodedData}`;

        } catch (error) {
            console.error('Error generating share URL:', error);
            return '';
        }
    }

    async createGist(shareData) {
        try {
            const gistData = {
                description: `Escriba Note: ${shareData.t} (${shareData.s})`,
                public: true,
                files: {
                    "escriba-note.json": {
                        content: JSON.stringify(shareData, null, 2)
                    }
                }
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gistData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const gist = await response.json();
                return `${window.location.origin}${window.location.pathname}?gist=${gist.id}`;
            } else if (response.status === 403) {
                console.warn('GitHub API rate limit reached, falling back to URL encoding');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('GitHub API request timed out, falling back to URL encoding');
            } else {
                console.warn('Could not create Gist, falling back to URL encoding:', error);
            }
        }
        return null;
    }

    exportCurrentNoteAsJson() {
        if (!this.currentNoteId) {
            this.showToast('No hay ningún apunte abierto para exportar', 'error');
            return;
        }

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

        if (!note || !subject) return;

        const shareData = {
            t: note.title,
            c: note.content,
            ty: note.type,
            s: subject.name,
            sc: subject.color,
            d: note.updatedAt,
            app: 'escriba',
            version: '1.0',
            exported: new Date().toISOString()
        };

        const jsonString = JSON.stringify(shareData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_escriba.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Apunte exportado como JSON', 'success');
    }

    importJsonNote() {
        document.getElementById('importJsonFile').click();
    }

    handleJsonImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const noteData = JSON.parse(e.target.result);

                if (!noteData.app || noteData.app !== 'escriba') {
                    this.showToast('Este archivo no es un apunte válido de Escriba', 'error');
                    return;
                }

                this.importNoteFromJson(noteData);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                this.showToast('Error al leer el archivo JSON', 'error');
            }
        };
        reader.readAsText(file);

        event.target.value = '';
    }

    importNoteFromJson(noteData) {
        let subject = this.subjects.find(s => s.name === noteData.s);

        if (!subject) {
            subject = {
                id: Date.now().toString(),
                name: noteData.s,
                code: '',
                professor: '',
                color: noteData.sc || '#3b82f6',
                notes: [],
                createdAt: new Date().toISOString(),
                expanded: true
            };
            this.subjects.unshift(subject);
        }

        const note = {
            id: Date.now().toString(),
            title: (noteData.title || noteData.t) + ' (Importado)',
            content: noteData.content || noteData.c,
            type: noteData.type || noteData.ty || 'lecture',
            subjectId: subject.id,
            favorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        subject.notes.unshift(note);
        this.saveCarpeta();
        this.renderSubjects();
        this.openNote(note.id);

        this.showToast(`Apunte "${note.title}" importado exitosamente`, 'success');
    }

    generateQRCode(url) {
        const canvas = document.getElementById('qrCanvas');
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = '#6c757d';
        ctx.font = '14px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Generando QR...', 100, 100);

        if (url.length > 2000) {
            this.showQRError(ctx, 'URL muy larga para QR');
            return;
        }

        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&format=png&data=${encodeURIComponent(url)}`;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                ctx.clearRect(0, 0, 200, 200);

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 200, 200);

                ctx.drawImage(img, 5, 5, 190, 190);

                ctx.strokeStyle = '#e9ecef';
                ctx.lineWidth = 2;
                ctx.strokeRect(1, 1, 198, 198);

            } catch (error) {
                console.error('Error drawing QR code:', error);
                this.showQRError(ctx, 'Error al mostrar QR');
            }
        };

        img.onerror = () => {
            this.showQRError(ctx, 'Error de conexión');
        };

        setTimeout(() => {
            if (!img.complete) {
                this.showQRError(ctx, 'Tiempo agotado');
            }
        }, 10000);

        img.src = qrApiUrl;
    }

    showQRError(ctx, message) {
        ctx.clearRect(0, 0, 200, 200);
        ctx.fillStyle = '#fff3cd';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = '#856404';
        ctx.font = '12px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ ' + message, 100, 80);
        ctx.fillText('Usa el enlace directo', 100, 100);
        ctx.fillText('para compartir', 100, 120);

        ctx.strokeStyle = '#ffc107';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 198, 198);
    }

    copyShareUrl() {
        const shareUrl = document.getElementById('shareUrl');
        shareUrl.select();
        shareUrl.setSelectionRange(0, 99999);

        try {
            document.execCommand('copy');
            this.showToast('Enlace copiado al portapapeles', 'success');
        } catch (err) {
            navigator.clipboard.writeText(shareUrl.value).then(() => {
                this.showToast('Enlace copiado al portapapeles', 'success');
            }).catch(() => {
                this.showToast('No se pudo copiar el enlace', 'error');
            });
        }
    }

    shareToWhatsApp() {
        const shareUrl = document.getElementById('shareUrl').value;
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

        if (!note || !subject) return;

        const message = `📚 Te comparto mis apuntes de ${subject.name}: "${note.title}"\n\n${shareUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    shareToEmail() {
        const shareUrl = document.getElementById('shareUrl').value;
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

        if (!note || !subject) return;

        const subject_line = `Apuntes de ${subject.name}: ${note.title}`;
        const body = `Hola,\n\nTe comparto mis apuntes de ${subject.name} sobre "${note.title}".\n\nPodés verlos en este enlace: ${shareUrl}\n\nSaludos!`;

        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject_line)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    }



    async checkForSharedNote() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('share');
        const gistId = urlParams.get('gist');

        if (gistId) {
            try {
                await this.loadFromGist(gistId);
                this.isViewingSharedNote = true;
            } catch (error) {
                console.error('Error loading shared note from Gist:', error);
                this.showToast('Error al cargar el apunte compartido desde Gist', 'error');
            }
        } else if (sharedData) {
            try {
                const decodedData = JSON.parse(this.base64ToUtf8(sharedData));
                this.displaySharedNote(decodedData);
                this.isViewingSharedNote = true;
            } catch (error) {
                console.error('Error loading shared note:', error);
                this.showToast('Error al cargar el apunte compartido', 'error');
            }
        }
    }

    async loadFromGist(gistId) {
        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const gist = await response.json();
            const files = Object.values(gist.files);

            if (files.length === 0) {
                throw new Error('No files found in Gist');
            }

            const jsonFile = files.find(file =>
                file.filename.includes('.json') ||
                file.filename.includes('escriba')
            ) || files[0];

            const noteData = JSON.parse(jsonFile.content);

            if (!noteData.app || noteData.app !== 'escriba') {
                throw new Error('This Gist does not contain a valid Escriba note');
            }

            this.displaySharedNote(noteData);

        } catch (error) {
            console.error('Error loading from Gist:', error);
            this.showToast('No se pudo cargar el apunte desde GitHub Gist', 'error');
            throw error;
        }
    }

    displaySharedNote(noteData) {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('noteEditor').style.display = 'flex';

        const noteContent = document.getElementById('noteContent');
        noteContent.contentEditable = false;
        noteContent.style.cursor = 'default';

        const title = noteData.title || noteData.t || 'Apunte Compartido';
        const content = noteData.content || noteData.c || '';
        const type = noteData.type || noteData.ty || 'lecture';
        const subject = noteData.subject || noteData.s || 'Materia';
        const subjectColor = noteData.subjectColor || noteData.sc || '#3b82f6';
        const date = noteData.date || noteData.d || new Date().toISOString();

        document.getElementById('noteTitle').value = title;
        document.getElementById('noteTitle').disabled = true;
        document.getElementById('noteContent').innerHTML = content;
        document.getElementById('noteTypeSelect').value = type;
        document.getElementById('noteTypeSelect').disabled = true;
        document.getElementById('noteDate').textContent = this.formatDate(date);

        document.getElementById('noteSubject').textContent = subject;
        document.getElementById('noteType').textContent = this.getNoteTypeLabel(type);

        document.getElementById('favoriteBtn').style.display = 'none';
        document.getElementById('shareNoteBtn').style.display = 'none';
        document.getElementById('deleteNoteBtn').style.display = 'none';

        document.querySelector('.editor-toolbar').style.display = 'none';

        this.addSharedNoteBanner({
            title: title,
            content: content,
            type: type,
            subject: subject,
            subjectColor: subjectColor,
            date: date
        });
    }

    addSharedNoteBanner(noteData) {
        const banner = document.createElement('div');
        banner.className = 'shared-note-banner';
        banner.innerHTML = `
            <div class="shared-banner-content">
                <i class="fas fa-share-alt"></i>
                <span>Estás viendo un apunte compartido de <strong>${this.escapeHtml(noteData.subject)}</strong></span>
                <button id="openInEscriba" class="btn btn-primary btn-sm">
                    <i class="fas fa-plus"></i> Agregar a mi Escriba
                </button>
            </div>
        `;

        const noteEditor = document.getElementById('noteEditor');
        noteEditor.insertBefore(banner, noteEditor.firstChild);

        document.getElementById('openInEscriba').addEventListener('click', () => {
            this.importSharedNote(noteData);
        });
    }

    importSharedNote(noteData) {
        let subject = this.subjects.find(s => s.name === noteData.subject);

        if (!subject) {
            subject = {
                id: Date.now().toString(),
                name: noteData.subject,
                code: '',
                professor: '',
                color: noteData.subjectColor || '#3b82f6',
                notes: [],
                createdAt: new Date().toISOString(),
                expanded: true
            };
            this.subjects.unshift(subject);
        }

        const note = {
            id: Date.now().toString(),
            title: noteData.title + ' (Compartido)',
            content: noteData.content,
            type: noteData.type || 'lecture',
            subjectId: subject.id,
            favorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        subject.notes.unshift(note);
        this.saveCarpeta();

        window.history.replaceState({}, document.title, window.location.pathname);
        location.reload();
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

        if (this.subjects.length === 1) {
            this.createNoteInSubject(this.subjects[0].id);
            return;
        }

        this.showSubjectPickerModal();
    }

    createNoteInSubject(subjectId) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (!subject) return;

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
        this.showToast(`Nuevo apunte creado en ${subject.name}`, 'success');
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

        if (window.innerWidth <= 768) {
            this.closeMobileMenu();
        }

        this.cleanupExistingEditors();
        
        this.currentNoteId = noteId;

        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('noteEditor').style.display = 'flex';

        document.getElementById('noteTitle').value = note.title;
        this.restoreNoteContent(note.content);
        document.getElementById('noteTypeSelect').value = note.type || 'lecture';
        document.getElementById('noteLanguageSelect').value = note.codeLanguage || 'javascript';
        document.getElementById('noteDate').textContent = this.formatDate(note.updatedAt);

        document.getElementById('noteSubject').textContent = subject.name;
        document.getElementById('noteType').textContent = this.getNoteTypeLabel(note.type || 'lecture');

        const favoriteBtn = document.getElementById('favoriteBtn');
        favoriteBtn.classList.toggle('active', note.favorite || false);

        document.querySelectorAll('.note-item, .note-item-compact').forEach(item => {
            item.classList.toggle('active', item.dataset.noteId === noteId);
        });

        this.handleNoteTypeChange(note.type || 'lecture');

        setTimeout(() => {
            document.getElementById('noteContent').focus();
            this.addLinkListeners();
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
            exercise: '✏️ Ejercicios',
            math: '🔢 Matemáticas'
        };
        return types[type] || '📝 Apuntes de Clase';
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
            exercise: '✏️',
            math: '🔢'
        };
        return icons[type] || '📝';
    }

    extractTextPreview(html) {
        if (!html) return 'Sin contenido';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        const preview = textContent.trim().replace(/\s+/g, ' ');
        return preview.length > 150 ? preview.substring(0, 150) + '...' : preview;
    }

    handleNoteTypeChange(noteType) {
        if (noteType === 'math') {
            this.setupMathMode();
        } else {
            this.disableMathMode();
        }
        
        setTimeout(() => this.updateToolbarStates(), 50);
    }

    setupMathMode() {
        const noteContent = document.getElementById('noteContent');
        
        noteContent.classList.add('math-mode');
        
        let mathToolbar = document.getElementById('mathToolbar');
        if (!mathToolbar) {
            mathToolbar = document.createElement('div');
            mathToolbar.id = 'mathToolbar';
            mathToolbar.className = 'math-toolbar';
            mathToolbar.innerHTML = `
                <div class="math-toolbar-group">
                    <span class="math-toolbar-label">Símbolos Matemáticos:</span>
                    <button class="math-symbol-btn" data-symbol="∞" title="Infinito">∞</button>
                    <button class="math-symbol-btn" data-symbol="∑" title="Sumatoria">∑</button>
                    <button class="math-symbol-btn" data-symbol="∫" title="Integral">∫</button>
                    <button class="math-symbol-btn" data-symbol="∂" title="Derivada parcial">∂</button>
                    <button class="math-symbol-btn" data-symbol="√" title="Raíz cuadrada">√</button>
                    <button class="math-symbol-btn" data-symbol="π" title="Pi">π</button>
                    <button class="math-symbol-btn" data-symbol="θ" title="Theta">θ</button>
                    <button class="math-symbol-btn" data-symbol="α" title="Alfa">α</button>
                    <button class="math-symbol-btn" data-symbol="β" title="Beta">β</button>
                    <button class="math-symbol-btn" data-symbol="λ" title="Lambda">λ</button>
                    <button class="math-symbol-btn" data-symbol="μ" title="Mu">μ</button>
                    <button class="math-symbol-btn" data-symbol="σ" title="Sigma">σ</button>
                </div>
                <div class="math-toolbar-group">
                    <span class="math-toolbar-label">Operadores:</span>
                    <button class="math-symbol-btn" data-symbol="±" title="Más/menos">±</button>
                    <button class="math-symbol-btn" data-symbol="≤" title="Menor o igual">≤</button>
                    <button class="math-symbol-btn" data-symbol="≥" title="Mayor o igual">≥</button>
                    <button class="math-symbol-btn" data-symbol="≠" title="No igual">≠</button>
                    <button class="math-symbol-btn" data-symbol="≈" title="Aproximadamente">≈</button>
                    <button class="math-symbol-btn" data-symbol="∈" title="Pertenece a">∈</button>
                    <button class="math-symbol-btn" data-symbol="∀" title="Para todo">∀</button>
                    <button class="math-symbol-btn" data-symbol="∃" title="Existe">∃</button>
                    <button class="math-symbol-btn" data-symbol="∩" title="Intersección">∩</button>
                    <button class="math-symbol-btn" data-symbol="∪" title="Unión">∪</button>
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

            const toolbar = document.querySelector('.editor-toolbar');
            toolbar.parentNode.insertBefore(mathToolbar, toolbar.nextSibling);

            mathToolbar.querySelectorAll('.math-symbol-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.insertMathSymbol(e.target.dataset.symbol);
                });
            });

            mathToolbar.querySelectorAll('.math-function-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.insertMathFunction(e.target.dataset.action);
                });
            });
        }

        mathToolbar.style.display = 'flex';
        
        this.showToast('Modo matemático activado - símbolos y funciones disponibles', 'info');
    }

    disableMathMode() {
        const noteContent = document.getElementById('noteContent');
        const mathToolbar = document.getElementById('mathToolbar');
        
        noteContent.classList.remove('math-mode');
        
        if (mathToolbar) {
            mathToolbar.style.display = 'none';
        }
    }

    insertMathSymbol(symbol) {
        const noteContent = document.getElementById('noteContent');
        
        if (!noteContent.contains(document.activeElement)) {
            noteContent.focus();
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const symbolNode = document.createTextNode(symbol);
            range.insertNode(symbolNode);
            range.setStartAfter(symbolNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            document.execCommand('insertText', false, symbol);
        }

        this.debouncedSave();
    }

    insertMathFunction(action) {
        const noteContent = document.getElementById('noteContent');
        
        if (!noteContent.contains(document.activeElement)) {
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
        } else {
            document.execCommand('insertText', false, template);
        }

        this.debouncedSave();
    }

    toggleMathMode() {
        if (!this.currentNoteId) {
            this.showToast('Abrir un apunte primero', 'error');
            return;
        }

        const noteTypeSelect = document.getElementById('noteTypeSelect');
        const currentType = noteTypeSelect.value;
        
        if (currentType === 'math') {
            noteTypeSelect.value = 'lecture';
            this.handleNoteTypeChange('lecture');
            this.saveCurrentNote();
            this.showToast('Modo matemático desactivado', 'info');
        } else {
            noteTypeSelect.value = 'math';
            this.handleNoteTypeChange('math');
            this.saveCurrentNote();
        }
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
        const content = this.serializeNoteContent();
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

    deleteSubject(subjectId) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        if (this.currentNoteId) {
            const currentNote = subject.notes.find(n => n.id === this.currentNoteId);
            if (currentNote) {
                this.currentNoteId = null;
                this.showWelcomeScreen(true);
            }
        }

        const subjectIndex = this.subjects.findIndex(s => s.id === subjectId);
        if (subjectIndex !== -1) {
            this.subjects.splice(subjectIndex, 1);
            this.saveCarpeta();
            this.renderSubjects();
            this.showToast(`Materia "${subject.name}" eliminada`, 'success');

            if (this.subjects.length === 0) {
                this.showWelcomeScreen(true);
            }
        }
    }

    renderSubjects() {
        const container = document.getElementById('subjectsContainer');

        if (this.subjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No tenés materias creadas todavía.</p>
                    <button class="btn btn-primary" onclick="cuaderno.showSubjectModal()">
                        <i class="fas fa-folder-plus"></i> Crear Primera Materia
                    </button>
                </div>
            `;
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
                    <div class="subject-actions">
                        <button class="btn-add-note" data-subject-id="${subject.id}" title="Crear apunte en ${this.escapeHtml(subject.name)}">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn-delete-subject" data-subject-id="${subject.id}" title="Eliminar materia">
                            <i class="fas fa-trash"></i>
                        </button>
                        <i class="fas fa-chevron-right subject-toggle"></i>
                    </div>
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
            header.addEventListener('click', (e) => {
                if (e.target.closest('.subject-actions')) return;
                
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
            item.addEventListener('click', () => {
                this.openNote(item.dataset.noteId);
                if (window.innerWidth <= 768) {
                    this.closeMobileMenu();
                }
            });
        });

        container.querySelectorAll('.btn-add-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const subjectId = btn.dataset.subjectId;
                this.createNoteInSubject(subjectId);
            });
        });

        container.querySelectorAll('.btn-delete-subject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const subjectId = btn.dataset.subjectId;
                this.confirmDeleteSubject(subjectId);
            });
        });
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

    renderFavoriteNotes() {
        const container = document.querySelector('#favoritesContainer .favorites-notes-list');

        if (!container) {
            return;
        }

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
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <h3>Sin favoritos</h3>
                    <p>No tenés apuntes marcados como favoritos todavía.<br>Hacé click en la estrella de cualquier apunte para agregarlo a favoritos.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = favoriteNotes.map(note => `
            <div class="favorite-note-item ${this.currentNoteId === note.id ? 'active' : ''}" 
                 data-note-id="${note.id}" data-subject-id="${note.subjectId}">
                <div class="note-item-header">
                    <span class="note-item-title">${this.escapeHtml(note.title || 'Sin título')}</span>
                    <span class="note-item-type">${this.getNoteTypeLabel(note.type)}</span>
                </div>
                <div class="note-item-meta">
                    <span class="note-item-subject" style="color: ${note.subjectColor}">${this.escapeHtml(note.subjectName)}</span>
                    <span class="note-item-date">
                        <i class="fas fa-clock"></i>
                        ${this.formatDate(note.updatedAt)}
                    </span>
                    <i class="fas fa-star" style="color: var(--accent-yellow);"></i>
                </div>
                <div class="note-item-preview">${this.extractTextPreview(note.content)}</div>
            </div>
        `).join('');

        container.querySelectorAll('.favorite-note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.noteId;
                this.openNote(noteId);
            });
        });
    }

    renderRecentNotes() {
        const container = document.querySelector('#recentContainer .recent-notes-list');

        if (!container) {
            return;
        }

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
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>Sin apuntes recientes</h3>
                    <p>No hay apuntes recientes para mostrar.<br>Creá tu primera materia y apunte para comenzar.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentNotes.map(note => `
            <div class="recent-note-item ${this.currentNoteId === note.id ? 'active' : ''}" 
                 data-note-id="${note.id}" data-subject-id="${note.subjectId}">
                <div class="note-item-header">
                    <span class="note-item-title">${this.escapeHtml(note.title || 'Sin título')}</span>
                    <span class="note-item-type">${this.getNoteTypeLabel(note.type)}</span>
                </div>
                <div class="note-item-meta">
                    <span class="note-item-subject" style="color: ${note.subjectColor}">${this.escapeHtml(note.subjectName)}</span>
                    <span class="note-item-date">
                        <i class="fas fa-clock"></i>
                        ${this.formatDate(note.updatedAt)}
                    </span>
                    ${note.favorite ? '<i class="fas fa-star" style="color: var(--accent-yellow);"></i>' : ''}
                </div>
                <div class="note-item-preview">${this.extractTextPreview(note.content)}</div>
            </div>
        `).join('');

        container.querySelectorAll('.recent-note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.noteId;
                this.openNote(noteId);
            });
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

        const subjectsContainer = document.getElementById('subjectsContainer');
        const recentContainer = document.getElementById('recentContainer');
        const favoritesContainer = document.getElementById('favoritesContainer');
        const calendarContainer = document.getElementById('calendarContainer');

        subjectsContainer.style.display = 'none';
        recentContainer.style.display = 'none';
        favoritesContainer.style.display = 'none';
        calendarContainer.style.display = 'none';

        switch (view) {
            case 'subjects':
                subjectsContainer.style.display = 'block';
                this.renderSubjects();
                break;
            case 'recent':
                recentContainer.style.display = 'block';
                this.renderRecentNotes();
                break;
            case 'favorites':
                favoritesContainer.style.display = 'block';
                this.renderFavoriteNotes();
                break;
            case 'calendar':
                calendarContainer.style.display = 'flex';
                this.renderCalendar();
                break;
            default:
                subjectsContainer.style.display = 'block';
                this.renderSubjects();
                break;
        }
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
        const content = document.getElementById('noteContent');
        content.focus();

        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return;

        let parentElement = range.commonAncestorContainer;
        if (parentElement.nodeType === Node.TEXT_NODE) {
            parentElement = parentElement.parentElement;
        }

        if (parentElement.tagName === 'MARK' || parentElement.closest('mark')) {
            document.execCommand('removeFormat');
            this.saveCurrentNote();
            return;
        }

        const selectedText = range.toString();
        if (selectedText.trim()) {
            document.execCommand('insertHTML', false, `<mark>${selectedText}</mark>`);
            this.saveCurrentNote();
        }

        setTimeout(() => this.updateToolbarStates(), 10);
    }

    toggleInlineCode() {
        const content = document.getElementById('noteContent');
        content.focus();

        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            this.insertEmptyInlineCode();
            return;
        }

        const range = selection.getRangeAt(0);
        
        if (range.collapsed) {
            this.insertEmptyInlineCode();
            return;
        }

        let parentElement = range.commonAncestorContainer;
        if (parentElement.nodeType === Node.TEXT_NODE) {
            parentElement = parentElement.parentElement;
        }

        if (parentElement.tagName === 'CODE' || parentElement.closest('code')) {
            this.removeInlineCodeFormat(parentElement.closest('code') || parentElement);
            return;
        }

        const selectedText = range.toString();
        if (selectedText.trim()) {
            try {
                document.execCommand('insertHTML', false, `<code class="inline-code">${selectedText}</code>`);
                this.saveCurrentNote();
                this.showToast('Código inline aplicado', 'success');
            } catch (error) {
                console.warn('Error applying inline code:', error);
                this.insertInlineCodeElement(selectedText, range);
            }
        }

        setTimeout(() => this.updateToolbarStates(), 10);
    }

    insertEmptyInlineCode() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            try {
                const codeElement = document.createElement('code');
                codeElement.className = 'inline-code';
                codeElement.textContent = 'código';
                
                range.deleteContents();
                range.insertNode(codeElement);
                
                range.selectNodeContents(codeElement);
                selection.removeAllRanges();
                selection.addRange(range);
                
                this.saveCurrentNote();
                this.showToast('Código inline insertado - escribí tu código', 'info');
                
            } catch (error) {
                console.warn('Error inserting empty inline code:', error);
                document.execCommand('insertHTML', false, '<code class="inline-code">código</code>');
                this.saveCurrentNote();
            }
        }
    }

    insertInlineCodeElement(text, range) {
        try {
            const codeElement = document.createElement('code');
            codeElement.className = 'inline-code';
            codeElement.textContent = text;
            
            range.deleteContents();
            range.insertNode(codeElement);
            
            range.setStartAfter(codeElement);
            range.collapse(true);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            this.saveCurrentNote();
            this.showToast('Código inline aplicado', 'success');
            
        } catch (error) {
            console.error('Error creating inline code element:', error);
        }
    }

    removeInlineCodeFormat(codeElement) {
        try {
            const text = codeElement.textContent;
            const textNode = document.createTextNode(text);
            
            codeElement.parentNode.replaceChild(textNode, codeElement);
            
            const range = document.createRange();
            const selection = window.getSelection();
            
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            this.saveCurrentNote();
            this.showToast('Formato de código removido', 'success');
            
            setTimeout(() => this.updateToolbarStates(), 10);
            
        } catch (error) {
            console.warn('Error removing inline code format:', error);
            document.execCommand('removeFormat');
            this.saveCurrentNote();
        }
    }

    updateToolbarStates() {
        const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
        commands.forEach(command => {
            const btn = document.querySelector(`[data-command="${command}"]`);
            if (btn) {
                btn.classList.toggle('active', document.queryCommandState(command));
            }
        });

        const inlineCodeBtn = document.getElementById('inlineCodeBtn');
        if (inlineCodeBtn) {
            const selection = window.getSelection();
            let isInCodeElement = false;
            
            if (selection.rangeCount > 0) {
                let element = selection.getRangeAt(0).commonAncestorContainer;
                if (element.nodeType === Node.TEXT_NODE) {
                    element = element.parentElement;
                }
                
                isInCodeElement = element.tagName === 'CODE' || element.closest('code');
            }
            
            inlineCodeBtn.classList.toggle('active', isInCodeElement);
        }

        const mathModeBtn = document.getElementById('mathModeBtn');
        if (mathModeBtn) {
            const noteTypeSelect = document.getElementById('noteTypeSelect');
            const isMathMode = noteTypeSelect && noteTypeSelect.value === 'math';
            mathModeBtn.classList.toggle('active', isMathMode);
        }

        this.updateLanguageSelectVisibility();
    }

    updateLanguageSelectVisibility() {
        const noteContent = document.getElementById('noteContent');
        const languageSelect = document.getElementById('noteLanguageSelect');
        
        if (!noteContent || !languageSelect) return;

        const codeBlocks = noteContent.querySelectorAll('.inline-ace-editor');
        const hasCodeBlocks = codeBlocks.length > 0;

        if (hasCodeBlocks) {
            languageSelect.style.display = 'block';
        } else {
            languageSelect.style.display = 'none';
        }
    }

    insertTabIndentation() {
        const tabSpaces = '    ';
        
        try {
            if (document.execCommand) {
                document.execCommand('insertText', false, tabSpaces);
            } else {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const textNode = document.createTextNode(tabSpaces);
                    range.insertNode(textNode);
                    
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
            
            this.showIndentationFeedback();
            
        } catch (error) {
            console.warn('Error insertando indentación:', error);
            try {
                document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                this.showIndentationFeedback();
            } catch (e) {
                console.error('No se pudo insertar indentación:', e);
            }
        }
    }

    showIndentationFeedback() {
        const noteContent = document.getElementById('noteContent');
        
        noteContent.classList.add('indenting');
        
        setTimeout(() => {
            noteContent.classList.remove('indenting');
        }, 150);
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
            console.warn('Error procesando indentación de selección:', error);
            if (!isShiftTab) {
                document.execCommand('indent');
            } else {
                document.execCommand('outdent');
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

    handleKeyboardShortcuts(e) {
        const noteContent = document.getElementById('noteContent');
        const activeElement = document.activeElement;

        const focusedEditor = noteContent.currentFocusedEditor;

        if (focusedEditor && (e.ctrlKey || e.metaKey)) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        focusedEditor.redo();
                    } else {
                        focusedEditor.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    focusedEditor.redo();
                    break;
            }
            return;
        }

        if (!noteContent.contains(activeElement)) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                
                if (!range.collapsed) {
                    this.handleTabIndentationForSelection(range, e.shiftKey);
                } else {
                    this.insertTabIndentation();
                }
            } else {
                this.insertTabIndentation();
            }
            
            this.debouncedSave();
            return;
        }

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
                case '`':
                case 'Backquote':
                    e.preventDefault();
                    this.toggleInlineCode();
                    break;
                case 'm':
                    e.preventDefault();
                    this.toggleMathMode();
                    break;
                case 'z':
                    if (!focusedEditor) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            document.execCommand('redo');
                        } else {
                            document.execCommand('undo');
                        }
                    }
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

    processImportData(dataString) {
        try {
            const importedData = JSON.parse(dataString);
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
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.processImportData(e.target.result);
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
            if (!this.currentNoteId) {
                document.getElementById('noteEditor').style.display = 'none';
            }
        }
    }

    saveCarpeta() {
        const cleanSubjects = this.cleanDataForStorage(this.subjects);
        localStorage.setItem('cuadernoDigital', JSON.stringify(cleanSubjects));

        if (window.githubSync && window.githubSync.isAuthenticated && !window.githubSync.syncInProgress) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = setTimeout(() => {
                this.triggerBackgroundSync();
            }, 10000);
        }
    }

    cleanDataForStorage(subjects) {
        return subjects.map(subject => ({
            ...subject,
            name: this.sanitizeText(subject.name),
            code: subject.code ? this.sanitizeText(subject.code) : subject.code,
            professor: subject.professor ? this.sanitizeText(subject.professor) : subject.professor,
            notes: subject.notes.map(note => ({
                ...note,
                title: this.sanitizeText(note.title),
                content: this.cleanNoteContent(note.content)
            }))
        }));
    }

    sanitizeText(text) {
        if (!text || typeof text !== 'string') return text;
        
        return text.normalize('NFC');
    }

    cleanNoteContent(content) {
        if (!content || typeof content !== 'string') return content;
        
        let cleaned = content.normalize('NFC');
        
        cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
        
        return cleaned;
    }

    async triggerBackgroundSync() {
        if (!window.githubSync || !window.githubSync.isAuthenticated || window.githubSync.syncInProgress) {
            return;
        }

        try {
            await window.githubSync.syncData(
                this.subjects,
                this.events,
                this.getAppSettings()
            );
            this.updateGitHubSyncUI();
        } catch (error) {
            console.warn('Background sync failed:', error);
        }
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

        const currentTheme = document.documentElement.getAttribute('data-theme') || settings.theme;

        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === currentTheme);
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

        const currentSettings = JSON.parse(localStorage.getItem('escribaSettings')) || {};
        currentSettings.theme = theme;
        localStorage.setItem('escribaSettings', JSON.stringify(currentSettings));

        this.showToast(`Tema "${this.getThemeName(theme)}" aplicado`, 'success');
    }

    getThemeName(theme) {
        const themeNames = {
            'dark': 'Oscuro',
            'light': 'Claro',
            'blue': 'Azul',
            'unq': 'UNQ',
            'forest': 'Bosque',
            'sunset': 'Atardecer',
            'aurora': 'Aurora',
            'cyberpunk': 'Matrix'
        };
        return themeNames[theme] || theme;
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

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobileOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (!sidebar || !overlay || !toggle) return;

        const isOpen = sidebar.classList.contains('mobile-open');

        if (isOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobileOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (!sidebar || !overlay || !toggle) return;

        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        toggle.classList.add('active');
        toggle.innerHTML = '<i class="fas fa-times"></i>';

        document.body.style.overflow = 'hidden';
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobileOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (!sidebar || !overlay || !toggle) return;

        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        toggle.classList.remove('active');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';

        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    showLinkModal() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        document.getElementById('linkText').value = selectedText || '';
        document.getElementById('linkSearchInput').value = '';

        this.currentSelection = selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;

        this.searchNotesForLink('');

        document.getElementById('linkModal').classList.add('active');
        document.getElementById('linkText').focus();

        this.selectedNoteForLink = null;
        document.getElementById('createLink').disabled = true;
    }

    hideLinkModal() {
        document.getElementById('linkModal').classList.remove('active');
        this.currentSelection = null;
        this.selectedNoteForLink = null;
    }

    searchNotesForLink(query) {
        const notesList = document.getElementById('linkNotesList');
        const allNotes = [];

        this.subjects.forEach(subject => {
            subject.notes.forEach(note => {
                if (note.id !== this.currentNoteId) {
                    allNotes.push({
                        ...note,
                        subjectName: subject.name,
                        subjectColor: subject.color
                    });
                }
            });
        });

        let filteredNotes = allNotes;
        if (query.trim()) {
            const searchTerm = query.toLowerCase();
            filteredNotes = allNotes.filter(note =>
                note.title.toLowerCase().includes(searchTerm) ||
                note.subjectName.toLowerCase().includes(searchTerm) ||
                this.stripHtml(note.content).toLowerCase().includes(searchTerm)
            );
        }

        filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        if (filteredNotes.length === 0) {
            notesList.innerHTML = `
                <div class="empty-link-results">
                    <i class="fas fa-search"></i>
                    <p>${query.trim() ? 'No se encontraron apuntes' : 'No hay otros apuntes disponibles'}</p>
                </div>
            `;
            return;
        }

        notesList.innerHTML = filteredNotes.map(note => `
            <div class="link-note-item" data-note-id="${note.id}">
                <div class="link-note-icon">
                    ${this.getNoteTypeIcon(note.type || 'lecture')}
                </div>
                <div class="link-note-details">
                    <div class="link-note-title">${this.escapeHtml(note.title)}</div>
                    <div class="link-note-meta">
                        <div class="link-note-subject">
                            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${note.subjectColor}"></div>
                            ${this.escapeHtml(note.subjectName)}
                        </div>
                        <div class="link-note-date">${this.formatDate(note.updatedAt)}</div>
                    </div>
                </div>
            </div>
        `).join('');

        notesList.querySelectorAll('.link-note-item').forEach(item => {
            item.addEventListener('click', () => {
                notesList.querySelectorAll('.link-note-item').forEach(i => i.classList.remove('selected'));

                item.classList.add('selected');
                this.selectedNoteForLink = item.dataset.noteId;

                document.getElementById('createLink').disabled = false;
            });
        });
    }

    createInternalLink() {
        const linkText = document.getElementById('linkText').value.trim();
        const noteId = this.selectedNoteForLink;

        if (!linkText) {
            this.showToast('Por favor ingresá el texto del enlace', 'error');
            return;
        }

        if (!noteId) {
            this.showToast('Por favor seleccioná un apunte para enlazar', 'error');
            return;
        }

        let linkedNote = null;
        for (const subject of this.subjects) {
            const note = subject.notes.find(n => n.id === noteId);
            if (note) {
                linkedNote = note;
                break;
            }
        }

        if (!linkedNote) {
            this.showToast('Error: No se pudo encontrar el apunte', 'error');
            return;
        }

        const linkHtml = `<a href="#" class="internal-link" data-note-id="${noteId}" title="Ir a: ${this.escapeHtml(linkedNote.title)}">${this.escapeHtml(linkText)}</a>`;

        const noteContent = document.getElementById('noteContent');
        noteContent.focus();

        if (this.currentSelection) {
            this.currentSelection.deleteContents();
            this.currentSelection.insertNode(document.createRange().createContextualFragment(linkHtml));
        } else {
            document.execCommand('insertHTML', false, linkHtml);
        }

        this.addLinkListeners();

        this.saveCurrentNote();

        this.hideLinkModal();
        this.showToast('Enlace creado exitosamente', 'success');
    }

    addLinkListeners() {
        document.querySelectorAll('#noteContent .internal-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const noteId = link.dataset.noteId;

                let noteExists = false;
                for (const subject of this.subjects) {
                    if (subject.notes.find(n => n.id === noteId)) {
                        noteExists = true;
                        break;
                    }
                }

                if (noteExists) {
                    this.openNote(noteId);
                    this.showToast('Navegando al apunte enlazado', 'info');
                } else {
                    link.classList.add('broken');
                    this.showToast('El apunte enlazado ya no existe', 'error');
                }
            });
        });
    }

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    renderCalendar() {
        this.renderCalendarGrid();
        this.renderEventsList();
        this.updateCalendarHeader();
    }

    updateCalendarHeader() {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const monthYear = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        document.getElementById('currentMonth').textContent = monthYear;
    }

    renderCalendarGrid() {
        const grid = document.getElementById('calendarGrid');
        const today = new Date();
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        grid.innerHTML = '';

        const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const prevMonth = new Date(year, month - 1, 0);
        const daysInPrevMonth = prevMonth.getDate();

        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const dayElement = this.createCalendarDay(
                daysInPrevMonth - i,
                new Date(year, month - 1, daysInPrevMonth - i),
                true
            );
            grid.appendChild(dayElement);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const dayElement = this.createCalendarDay(day, date, false, isToday);
            grid.appendChild(dayElement);
        }

        const totalCells = grid.children.length - 7;
        const remainingCells = 42 - totalCells;

        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createCalendarDay(
                day,
                new Date(year, month + 1, day),
                true
            );
            grid.appendChild(dayElement);
        }
    }

    createCalendarDay(dayNumber, date, isOtherMonth = false, isToday = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        const dayEvents = this.getEventsForDate(date);
        if (dayEvents.length > 0) {
            dayElement.classList.add('has-events');
        }

        dayElement.innerHTML = `
            <div class="calendar-day-number">${dayNumber}</div>
            <div class="calendar-events-indicator">
                ${dayEvents.slice(0, 3).map(event =>
            `<div class="event-dot ${event.type}"></div>`
        ).join('')}
            </div>
        `;

        dayElement.addEventListener('click', () => {
            if (!isOtherMonth) {
                this.showEventModal(date);
            }
        });

        return dayElement;
    }

    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => event.date === dateStr);
    }

    renderEventsList() {
        const eventsList = document.getElementById('eventsList');
        const upcomingEvents = this.getUpcomingEvents();

        if (upcomingEvents.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-events">
                    <i class="fas fa-calendar-check"></i>
                    <p>No hay exámenes próximos</p>
                    <button class="btn btn-primary btn-sm" onclick="cuaderno.showEventModal()">
                        <i class="fas fa-plus"></i> Agregar Examen
                    </button>
                </div>
            `;
            return;
        }

        eventsList.innerHTML = upcomingEvents.map(event => {
            const timeLeft = this.getTimeLeft(event.date);
            const subject = this.subjects.find(s => s.id === event.subjectId);
            const subjectName = subject ? subject.name : 'Sin materia';

            return `
                <div class="event-item" data-event-id="${event.id}">
                    <div class="event-icon ${event.type}">
                        ${this.getEventTypeIcon(event.type)}
                    </div>
                    <div class="event-details">
                        <div class="event-title">${this.escapeHtml(event.title)}</div>
                        <div class="event-meta">
                            <div class="event-date">
                                <i class="fas fa-calendar"></i>
                                ${this.formatEventDate(event.date)}
                                ${event.time ? `<i class="fas fa-clock"></i> ${event.time}` : ''}
                            </div>
                            <div class="event-subject">
                                <i class="fas fa-book"></i>
                                ${this.escapeHtml(subjectName)}
                            </div>
                        </div>
                    </div>
                    <div class="event-time-left ${timeLeft.class}">
                        ${timeLeft.text}
                    </div>
                </div>
            `;
        }).join('');

        eventsList.querySelectorAll('.event-item').forEach(item => {
            item.addEventListener('click', () => {
                const eventId = item.dataset.eventId;
                this.editEvent(eventId);
            });
        });
    }

    getUpcomingEvents() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 10);
    }

    getTimeLeft(eventDate) {
        const today = new Date();
        const event = new Date(eventDate);
        const diffTime = event - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: 'Pasado', class: 'urgent' };
        } else if (diffDays === 0) {
            return { text: 'Hoy', class: 'urgent' };
        } else if (diffDays === 1) {
            return { text: 'Mañana', class: 'urgent' };
        } else if (diffDays <= 7) {
            return { text: `${diffDays} días`, class: 'soon' };
        } else if (diffDays <= 30) {
            return { text: `${diffDays} días`, class: 'normal' };
        } else {
            const weeks = Math.floor(diffDays / 7);
            return { text: `${weeks} semanas`, class: 'normal' };
        }
    }

    getEventTypeIcon(type) {
        const icons = {
            parcial: '📊',
            final: '🎯',
            tp: '📋',
            quiz: '❓',
            presentacion: '🎤',
            entrega: '📤'
        };
        return icons[type] || '📅';
    }

    formatEventDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-AR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
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

    showEventModal(date = null) {
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('eventModalTitle');
        const deleteBtn = document.getElementById('deleteEvent');

        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDate').value = date ? date.toISOString().split('T')[0] : '';
        document.getElementById('eventTime').value = '';
        document.getElementById('eventType').value = 'parcial';
        document.getElementById('eventNotes').value = '';

        const subjectSelect = document.getElementById('eventSubject');
        subjectSelect.innerHTML = '<option value="">Seleccionar materia...</option>' +
            this.subjects.map(subject =>
                `<option value="${subject.id}">${this.escapeHtml(subject.name)}</option>`
            ).join('');

        if (this.currentEventId) {
            modalTitle.textContent = 'Editar Examen';
            deleteBtn.style.display = 'inline-flex';
            this.loadEventData();
        } else {
            modalTitle.textContent = 'Agregar Examen';
            deleteBtn.style.display = 'none';
        }

        modal.classList.add('active');
        document.getElementById('eventTitle').focus();
    }

    hideEventModal() {
        document.getElementById('eventModal').classList.remove('active');
        this.currentEventId = null;
    }

    loadEventData() {
        const event = this.events.find(e => e.id === this.currentEventId);
        if (!event) return;

        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventSubject').value = event.subjectId || '';
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventNotes').value = event.notes || '';
    }

    saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const subjectId = document.getElementById('eventSubject').value;
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const type = document.getElementById('eventType').value;
        const notes = document.getElementById('eventNotes').value.trim();

        if (!title) {
            this.showToast('Por favor ingresá el título del examen', 'error');
            return;
        }

        if (!date) {
            this.showToast('Por favor seleccioná una fecha', 'error');
            return;
        }

        const eventData = {
            id: this.currentEventId || Date.now().toString(),
            title,
            subjectId,
            date,
            time,
            type,
            notes,
            createdAt: this.currentEventId ?
                this.events.find(e => e.id === this.currentEventId).createdAt :
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentEventId) {
            const index = this.events.findIndex(e => e.id === this.currentEventId);
            this.events[index] = eventData;
            this.showToast('Examen actualizado exitosamente', 'success');
        } else {
            this.events.push(eventData);
            this.showToast('Examen agregado exitosamente', 'success');
        }

        this.saveEvents();
        this.renderCalendar();
        this.hideEventModal();
    }

    editEvent(eventId) {
        this.currentEventId = eventId;
        this.showEventModal();
    }

    deleteEvent() {
        if (!this.currentEventId) return;

        if (confirm('¿Estás seguro de que querés eliminar este examen?')) {
            this.events = this.events.filter(e => e.id !== this.currentEventId);
            this.saveEvents();
            this.renderCalendar();
            this.hideEventModal();
            this.showToast('Examen eliminado exitosamente', 'success');
        }
    }

    saveEvents() {
        const cleanEvents = this.events.map(event => ({
            ...event,
            title: this.sanitizeText(event.title),
            notes: event.notes ? this.sanitizeText(event.notes) : event.notes
        }));
        
        localStorage.setItem('cuadernoEvents', JSON.stringify(cleanEvents));
    }
}

let cuaderno;

document.addEventListener('DOMContentLoaded', () => {
    cuaderno = new CuadernoDigital();
    window.cuaderno = cuaderno;
    cuaderno.init();
});