import { escapeHtml, formatDate } from '../utils/helpers.js';

export const renderSubjects = (container, subjects, callbacks = {}, showArchived = false) => {
    if (!container) return;

    const visibleSubjects = showArchived ? subjects : subjects.filter(s => !s.archived);

    if (visibleSubjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>${showArchived ? 'No tenés materias archivadas.' : 'No tenés materias creadas todavía.'}</p>
                ${!showArchived ? `
                <button class="btn btn-primary" id="welcomeNewSubjectBtn">
                    <i class="fas fa-folder-plus"></i> Crear Primera Materia
                </button>
                ` : ''}
            </div>
        `;

        const welcomeBtn = container.querySelector('#welcomeNewSubjectBtn');
        if (welcomeBtn && callbacks.onAddSubject) {
            welcomeBtn.addEventListener('click', callbacks.onAddSubject);
        }
        return;
    }

    container.innerHTML = visibleSubjects.map(subject => `
        <div class="subject-folder ${subject.expanded ? 'expanded' : ''} ${subject.archived ? 'archived' : ''}" data-subject-id="${subject.id}">
            <div class="subject-header">
                <div class="subject-info">
                    <div class="subject-icon" style="background: ${subject.color}" data-tooltip="${escapeHtml(subject.name)}">
                        ${subject.code ? escapeHtml(subject.code.slice(0, 3)) : escapeHtml(subject.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase())}
                    </div>
                    <div class="subject-details">
                        <span class="subject-name">${escapeHtml(subject.name)}</span>
                        ${subject.code ? `<span class="subject-code">${escapeHtml(subject.code)}</span>` : ''}
                    </div>
                    <span class="subject-count">${subject.notes.length}</span>
                </div>
                <div class="subject-actions">
                    <button class="btn-add-note" data-subject-id="${subject.id}" title="Crear apunte">
                        <i class="fas fa-plus"></i>
                    </button>
                    <div class="subject-options-wrapper" data-subject-id="${subject.id}">
                        <button class="btn-subject-options" title="Más opciones">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="subject-options-menu">
                            <button class="menu-item btn-edit-subject" data-subject-id="${subject.id}">
                                <i class="fas fa-pencil"></i> <span>Editar</span>
                            </button>
                            <button class="menu-item btn-archive-subject" data-subject-id="${subject.id}">
                                <i class="fas ${subject.archived ? 'fa-box-open' : 'fa-box-archive'}"></i> <span>${subject.archived ? 'Desarchivar' : 'Archivar'}</span>
                            </button>
                            <div class="menu-divider"></div>
                            <button class="menu-item btn-delete-subject" data-subject-id="${subject.id}">
                                <i class="fas fa-trash"></i> <span>Eliminar</span>
                            </button>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right subject-toggle"></i>
                </div>
            </div>
            <div class="notes-list">
                ${subject.notes.length === 0 ?
            '<div class="empty-subject">No hay apuntes todavía</div>' :
            subject.notes.map(note => `
                        <div class="note-item ${note.favorite ? 'favorite' : ''} ${note.isActive ? 'active' : ''}" data-note-id="${note.id}">
                            <div class="note-connector-dot"></div>
                            <div class="note-type-indicator">
                                ${note.mathMode ? '<i class="fas fa-square-root-alt" title="Math Mode"></i>' : '<i class="far fa-file-alt"></i>'}
                            </div>
                            <div class="note-details">
                                <h3>${escapeHtml(note.title)}</h3>
                                <div class="note-meta">
                                    <span class="note-date">${formatDate(note.updatedAt)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')
        }
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.subject-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const optionsBtn = e.target.closest('.btn-subject-options');
            if (optionsBtn) {
                e.stopPropagation();
                const wrapper = optionsBtn.closest('.subject-options-wrapper');
                const folder = optionsBtn.closest('.subject-folder');
                const isOpened = wrapper.classList.contains('active');

                document.querySelectorAll('.subject-options-wrapper.active').forEach(w => w.classList.remove('active'));
                document.querySelectorAll('.subject-folder.menu-active').forEach(f => f.classList.remove('menu-active'));

                if (!isOpened) {
                    wrapper.classList.add('active');
                    if (folder) folder.classList.add('menu-active');
                }
                return;
            }

            const menu = e.target.closest('.subject-options-menu');
            if (menu) {
                e.stopPropagation();
                setTimeout(() => {
                    menu.closest('.subject-options-wrapper').classList.remove('active');
                }, 100);
            }

            const editBtn = e.target.closest('.btn-edit-subject');
            const archiveBtn = e.target.closest('.btn-archive-subject');
            const deleteBtn = e.target.closest('.btn-delete-subject');

            if (editBtn || archiveBtn || deleteBtn) return;

            const subjectId = header.closest('.subject-folder').dataset.subjectId;
            if (callbacks.onSubjectClick) callbacks.onSubjectClick(subjectId);
        });
    });

    container.querySelectorAll('.btn-add-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const subjectId = btn.dataset.subjectId;
            if (callbacks.onAddNote) callbacks.onAddNote(subjectId);
        });
    });

    container.querySelectorAll('.btn-archive-subject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const subjectId = btn.dataset.subjectId;
            if (callbacks.onArchiveSubject) callbacks.onArchiveSubject(subjectId);
        });
    });

    container.querySelectorAll('.btn-edit-subject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const subjectId = btn.dataset.subjectId;
            if (callbacks.onEditSubject) callbacks.onEditSubject(subjectId);
        });
    });

    container.querySelectorAll('.btn-delete-subject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const subjectId = btn.dataset.subjectId;
            if (callbacks.onDeleteSubject) callbacks.onDeleteSubject(subjectId);
        });
    });

    container.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', () => {
            const noteId = item.dataset.noteId;
            if (callbacks.onNoteClick) callbacks.onNoteClick(noteId);
        });
    });

    const welcomeBtn = container.querySelector('#welcomeNewSubjectBtn');
    if (welcomeBtn && callbacks.onAddSubject) {
        welcomeBtn.addEventListener('click', callbacks.onAddSubject);
    }
};

export const updateSemesterInfo = (element) => {
    if (!element) return;

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

    element.textContent = semester;
};

export const renderRecentNotes = (container, subjects, currentNoteId, callbacks = {}) => {
    if (!container) return;

    const allNotes = [];
    subjects.filter(s => !s.archived).forEach(subject => {
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
                <p>No hay apuntes recientes para mostrar.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="recent-notes-list">
            ${recentNotes.map(note => `
                <div class="recent-note-item ${currentNoteId === note.id ? 'active' : ''}" data-note-id="${note.id}">
                    <div class="note-color-dot" style="background: ${note.subjectColor}" data-tooltip="${escapeHtml(note.subjectName)}"></div>
                    <div class="note-type-indicator">
                        ${note.mathMode ? '<i class="fas fa-square-root-alt"></i>' : ''}
                    </div>
                    <div class="note-item-body">
                        <span class="note-item-title">${escapeHtml(note.title || 'Sin título')}</span>
                        <div class="note-item-meta">
                            <span class="note-subject">${escapeHtml(note.subjectName)}</span>
                            <span class="note-meta-sep">·</span>
                            <span class="note-date">${formatDate(note.updatedAt)}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    container.querySelectorAll('.recent-note-item').forEach(item => {
        item.addEventListener('click', () => {
            const noteId = item.dataset.noteId;
            if (callbacks.onNoteClick) callbacks.onNoteClick(noteId);
        });
    });
};

export const renderFavoriteNotes = (container, subjects, currentNoteId, callbacks = {}) => {
    if (!container) return;

    const favoriteNotes = [];
    subjects.filter(s => !s.archived).forEach(subject => {
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
                <p>No tenés apuntes favoritos todavía.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="favorites-notes-list">
            ${favoriteNotes.map(note => `
                <div class="favorite-note-item ${currentNoteId === note.id ? 'active' : ''}" data-note-id="${note.id}">
                    <div class="note-color-dot" style="background: ${note.subjectColor}" data-tooltip="${escapeHtml(note.subjectName)}"></div>
                    <div class="note-type-indicator">
                        ${note.mathMode ? '<i class="fas fa-square-root-alt"></i>' : ''}
                    </div>
                    <div class="note-item-body">
                        <span class="note-item-title">${escapeHtml(note.title || 'Sin título')}</span>
                        <div class="note-item-meta">
                            <span class="note-subject">${escapeHtml(note.subjectName)}</span>
                            <span class="note-meta-sep">·</span>
                            <span class="note-date">${formatDate(note.updatedAt)}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    container.querySelectorAll('.favorite-note-item').forEach(item => {
        item.addEventListener('click', () => {
            const noteId = item.dataset.noteId;
            if (callbacks.onNoteClick) callbacks.onNoteClick(noteId);
        });
    });
};
