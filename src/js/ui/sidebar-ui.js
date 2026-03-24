import { escapeHtml, formatDate } from '../utils/helpers.js';

export const renderSubjects = (container, subjects, callbacks = {}) => {
    if (!container) return;

    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No tenés materias creadas todavía.</p>
                <button class="btn btn-primary" id="welcomeNewSubjectBtn">
                    <i class="fas fa-folder-plus"></i> Crear Primera Materia
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = subjects.map(subject => `
        <div class="subject-folder ${subject.expanded ? 'expanded' : ''}" data-subject-id="${subject.id}">
            <div class="subject-header">
                <div class="subject-info">
                    <div class="subject-icon" style="background: ${subject.color}"></div>
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
                    <i class="fas fa-chevron-right subject-toggle"></i>
                </div>
            </div>
            <div class="notes-list">
                ${subject.notes.length === 0 ?
            '<div class="empty-subject">No hay apuntes todavía</div>' :
            subject.notes.map(note => `
                        <div class="note-item ${note.favorite ? 'favorite' : ''} ${note.isActive ? 'active' : ''}" data-note-id="${note.id}">
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

export const renderRecentNotes = (container, subjects, currentNoteId) => {
    if (!container) return;

    const allNotes = [];
    subjects.forEach(subject => {
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
                    <div class="note-item-header">
                        <span class="note-item-title">${escapeHtml(note.title || 'Sin título')}</span>
                    </div>
                    <div class="note-item-meta">
                        <span class="note-subject" style="color: ${note.subjectColor}">${escapeHtml(note.subjectName)}</span>
                        <span class="note-date">${formatDate(note.updatedAt)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

export const renderFavoriteNotes = (container, subjects, currentNoteId) => {
    if (!container) return;

    const favoriteNotes = [];
    subjects.forEach(subject => {
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
                    <div class="note-item-header">
                        <span class="note-item-title">${escapeHtml(note.title || 'Sin título')}</span>
                    </div>
                    <div class="note-item-meta">
                        <span class="note-subject" style="color: ${note.subjectColor}">${escapeHtml(note.subjectName)}</span>
                        <span class="note-date">${formatDate(note.updatedAt)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};
