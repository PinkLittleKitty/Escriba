class CuadernoDigital {
    constructor() {
        this.subjects = JSON.parse(localStorage.getItem('cuadernoDigital')) || [];
        this.currentNoteId = null;
        this.currentView = 'subjects';
        this.selectedColor = '#3b82f6';
        this.autoSaveInterval = null;
    }

    init() {
        document.body.classList.add('loading');

        this.bindEvents();
        this.loadSettings();

        this.checkForSharedNote();

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

        document.getElementById('cancelSubjectPicker').addEventListener('click', () => this.hideSubjectPickerModal());
        document.getElementById('cancelShare').addEventListener('click', () => this.hideShareModal());
        document.getElementById('copyUrlBtn').addEventListener('click', () => this.copyShareUrl());
        document.getElementById('shareWhatsApp').addEventListener('click', () => this.shareToWhatsApp());
        document.getElementById('shareEmail').addEventListener('click', () => this.shareToEmail());



        document.querySelectorAll('#settingsModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideSettingsModal());
        });

        document.querySelectorAll('#subjectPickerModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideSubjectPickerModal());
        });

        document.querySelectorAll('#shareModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideShareModal());
        });

        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
        });

        document.getElementById('noteTitle').addEventListener('input', () => this.debouncedSave());
        document.getElementById('noteContent').addEventListener('input', () => this.debouncedSave());
        document.getElementById('noteTypeSelect').addEventListener('change', () => this.saveCurrentNote());
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
        document.getElementById('insertCodeBtn').addEventListener('click', () => this.insertCodeBlock());
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
                this.hideSubjectPickerModal();
                this.hideShareModal();
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

        document.getElementById('noteContent').addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const selection = window.getSelection();
                if (!selection.rangeCount) return;
                const range = selection.getRangeAt(0);
                let node = range.startContainer;
                let inCodeBlock = false;
                while (node && node !== document.getElementById('noteContent')) {
                    if (node.nodeName === 'CODE' && node.parentNode.nodeName === 'PRE') {
                        inCodeBlock = true;
                        break;
                    }
                    node = node.parentNode;
                }
                if (inCodeBlock) {
                    document.execCommand('insertText', false, '    ');
                } else {
                    document.execCommand('insertText', false, '\u00A0\u00A0\u00A0\u00A0');
                }
            }
        });
    }

    insertCodeBlock() {
        document.getElementById('noteContent').focus();
        document.execCommand(
            'insertHTML',
            false,
            '<pre><code></code></pre>'
        );
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

    showShareModal() {
        if (!this.currentNoteId) {
            this.showToast('No hay ningún apunte abierto para compartir', 'error');
            return;
        }

        const shareUrl = this.generateShareUrl();
        document.getElementById('shareUrl').value = shareUrl;
        this.generateQRCode(shareUrl);
        document.getElementById('shareModal').classList.add('active');
    }

    hideShareModal() {
        document.getElementById('shareModal').classList.remove('active');
    }

    generateShareUrl() {
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
            d: note.updatedAt
        };

        let content = shareData.c;
        if (content.length > 1000) {
            content = content.substring(0, 1000) + '... [contenido truncado para QR]';
            shareData.c = content;
        }

        try {
            const jsonString = JSON.stringify(shareData);
            const encodedData = btoa(encodeURIComponent(jsonString));
            const fullUrl = `${window.location.origin}${window.location.pathname}?share=${encodedData}`;

            return fullUrl;
        } catch (error) {
            console.error('Error generating share URL:', error);
            return '';
        }
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



    checkForSharedNote() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('share');

        if (sharedData) {
            try {
                const decodedData = JSON.parse(decodeURIComponent(atob(sharedData)));
                this.displaySharedNote(decodedData);
                this.isViewingSharedNote = true;
            } catch (error) {
                console.error('Error loading shared note:', error);
                this.showToast('Error al cargar el apunte compartido', 'error');
            }
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

    deleteSubject(subjectId) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        const noteCount = subject.notes.length;
        let confirmMessage = `¿Estás seguro de que querés eliminar la materia "${subject.name}"?`;

        if (noteCount > 0) {
            confirmMessage += `\n\nEsto también eliminará ${noteCount} apunte${noteCount > 1 ? 's' : ''} de esta materia.`;
        }

        confirmMessage += '\n\nEsta acción no se puede deshacer.';

        if (confirm(confirmMessage)) {
            if (this.currentNoteId) {
                const currentNote = subject.notes.find(n => n.id === this.currentNoteId);
                if (currentNote) {
                    this.currentNoteId = null;
                    this.showWelcomeScreen();
                }
            }

            const subjectIndex = this.subjects.findIndex(s => s.id === subjectId);
            if (subjectIndex !== -1) {
                this.subjects.splice(subjectIndex, 1);
                this.saveCarpeta();
                this.renderSubjects();
                this.showToast(`Materia "${subject.name}" eliminada`, 'success');

                if (this.subjects.length === 0) {
                    this.showWelcomeScreen();
                }
            }
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
                this.deleteSubject(subjectId);
            });
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
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new CuadernoDigital();
    app.init();
});