import { formatDate, escapeHtml, parseLocalDate } from '../utils/helpers.js';

export const renderDashboard = (container, data, handlers) => {
    if (!container) return;

    const { subjects, events } = data;
    const { onNoteClick, onNewSubject, onNewNote, onOpenGraph, onAddEvent, onEventClick } = handlers;

    const nextClass = getNextClass(subjects);
    const upcomingExams = getUpcomingExams(events);
    const recentActivity = getRecentActivity(subjects);
    const stats = calculateStats(subjects);

    const now = new Date();
    const hour = now.getHours();
    let greeting = '¡Hola!';
    if (hour >= 5 && hour < 12) greeting = '¡Buenos días!';
    else if (hour >= 12 && hour < 19) greeting = '¡Buenas tardes!';
    else greeting = '¡Buenas noches!';

    const dateStr = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

    container.innerHTML = `
        <div class="dashboard-header animate-in">
            <div class="dashboard-greeting">
                <h2 class="greeting-text">${greeting}</h2>
                <div class="dashboard-date">${dateStr}</div>
            </div>
        </div>

        <div class="dashboard-content">
            <div class="dashboard-main-col">
                <div class="dashboard-card next-class-hero animate-in" style="--delay: 1">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="fas fa-graduation-cap"></i>
                            <span>Próxima Clase</span>
                        </div>
                    </div>
                    <div class="hero-body">
                        ${nextClass ? `
                            <div class="hero-main">
                                <div class="countdown-big">${nextClass.isNow ? '¡Ahora!' : nextClass.timeUntil}</div>
                                <div class="subject-highlight">${escapeHtml(nextClass.subjectName)}</div>
                            </div>
                            <div class="hero-footer">
                                <span><i class="fas fa-clock"></i> ${nextClass.isToday ? 'Hoy' : nextClass.dayName} a las ${nextClass.time}</span>
                            </div>
                        ` : `
                            <div class="empty-hero">
                                <p>No hay clases programadas para los próximos días.</p>
                                <button class="btn btn-secondary btn-sm" onclick="document.dispatchEvent(new CustomEvent('openSubjectModal'))">
                                    Configurar horarios
                                </button>
                            </div>
                        `}
                    </div>
                </div>

                <div class="dashboard-card recent-activity animate-in" style="--delay: 2">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="fas fa-history"></i>
                            <span>Actividad Reciente</span>
                        </div>
                    </div>
                    <div class="activity-timeline">
                        ${recentActivity.length > 0 ? recentActivity.map(note => `
                            <div class="activity-item">
                                <div class="activity-marker"></div>
                                <div class="activity-content activity-link" data-note-id="${note.id}">
                                    <div class="activity-header">
                                        <span class="activity-note-title">${escapeHtml(note.title)}</span>
                                        <span class="activity-time-tag">${formatDate(note.updatedAt)}</span>
                                    </div>
                                    <div class="activity-subject">en ${escapeHtml(note.subjectName)}</div>
                                </div>
                            </div>
                        `).join('') : '<p class="empty-state">Aún no has escrito ningún apunte.</p>'}
                    </div>
                </div>
            </div>

            <div class="dashboard-side-col">
                <div class="dashboard-card exams-card animate-in" style="--delay: 3">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="fas fa-calendar-check"></i>
                            <span>Próximos Exámenes</span>
                        </div>
                        <button class="btn-icon-sm" id="dashAddEvent" title="Agregar Examen"><i class="fas fa-plus"></i></button>
                    </div>
                    <div class="dashboard-list">
                        ${upcomingExams.length > 0 ? upcomingExams.map(exam => `
                                <div class="list-item" data-event-id="${exam.id}">
                                    <div class="item-date-mini">
                                        <span class="item-day">${parseLocalDate(exam.date).getDate()}</span>
                                        <span class="item-month">${parseLocalDate(exam.date).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</span>
                                    </div>
                                    <div class="item-info">
                                        <div class="item-title-row">
                                            <span class="item-title">${escapeHtml(exam.title)}</span>
                                            <span class="type-tag tag-${exam.type}">${exam.type}</span>
                                        </div>
                                        <span class="item-subtitle">${escapeHtml(exam.notes || 'Sin notas adicionales')}</span>
                                    </div>
                                </div>
                            `).join('') : '<p class="empty-state">No hay exámenes próximos.</p>'}
                    </div>
                </div>

                <div class="dashboard-card stats-card animate-in" style="--delay: 4">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="fas fa-chart-pie"></i>
                            <span>Resumen</span>
                        </div>
                    </div>
                    <div class="stats-compact-grid">
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-book"></i></div>
                            <div class="stat-text">
                                <span class="stat-val">${stats.totalSubjects}</span>
                                <span class="stat-label">Materias</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-file-lines"></i></div>
                            <div class="stat-text">
                                <span class="stat-val">${stats.totalNotes}</span>
                                <span class="stat-label">Apuntes</span>
                            </div>
                        </div>
                    </div>
                    <div class="stats-footer-actions">
                        <button id="dashNewNote" class="btn btn-primary btn-full">
                            <i class="fas fa-plus"></i> Nuevo Apunte
                        </button>
                        <button id="dashOpenGraph" class="btn btn-secondary btn-full">
                            <i class="fas fa-network-wired"></i> Minimapa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.querySelectorAll('.activity-link').forEach(item => {
        item.addEventListener('click', () => {
            const noteId = item.dataset.noteId;
            if (noteId && onNoteClick) onNoteClick(noteId);
        });
    });

    container.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', () => {
            const eventId = item.dataset.eventId;
            if (eventId && onEventClick) onEventClick(eventId);
        });
    });

    container.querySelector('#dashNewNote')?.addEventListener('click', onNewNote);
    container.querySelector('#dashOpenGraph')?.addEventListener('click', onOpenGraph);
    container.querySelector('#dashAddEvent')?.addEventListener('click', onAddEvent);
};

function getNextClass(subjects) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let allScheduleItems = [];
    subjects.forEach(s => {
        if (!s.archived && s.schedule && Array.isArray(s.schedule)) {
            s.schedule.forEach(item => {
                if (!item.time || typeof item.time !== 'string') return;
                const timeParts = item.time.split(':');
                if (timeParts.length !== 2) return;

                const [hours, minutes] = timeParts.map(Number);
                const classTimeInMinutes = hours * 60 + minutes;
                allScheduleItems.push({
                    subjectName: s.name,
                    day: parseInt(item.day),
                    time: item.time,
                    timeInMinutes: classTimeInMinutes
                });
            });
        }
    });

    if (allScheduleItems.length === 0) return null;

    allScheduleItems.sort((a, b) => {
        let diffA = (a.day - currentDay + 7) % 7;
        let diffB = (b.day - currentDay + 7) % 7;

        if (diffA === 0 && a.timeInMinutes < currentTime) diffA = 7;
        if (diffB === 0 && b.timeInMinutes < currentTime) diffB = 7;

        if (diffA !== diffB) return diffA - diffB;
        return a.timeInMinutes - b.timeInMinutes;
    });

    const next = allScheduleItems[0];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const daysDiff = (next.day - currentDay + 7) % 7;

    let timeUntil = '';
    if (daysDiff === 0) {
        const diffMin = next.timeInMinutes - currentTime;
        if (diffMin < 0) timeUntil = "Siguiente semana";
        else if (diffMin < 60) timeUntil = `${diffMin} min`;
        else timeUntil = `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
    } else {
        timeUntil = `${daysDiff} ${daysDiff === 1 ? 'día' : 'días'}`;
    }

    return {
        ...next,
        dayName: dayNames[next.day],
        isToday: daysDiff === 0,
        isNow: daysDiff === 0 && Math.abs(next.timeInMinutes - currentTime) < 15,
        timeUntil
    };
}

function getUpcomingExams(events) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
        .filter(e => {
            const eventDate = parseLocalDate(e.date);
            return eventDate && eventDate >= now;
        })
        .sort((a, b) => {
            const dateA = parseLocalDate(a.date);
            const dateB = parseLocalDate(b.date);
            return (dateA || 0) - (dateB || 0);
        })
        .slice(0, 4);
}

function getRecentActivity(subjects) {
    let allNotes = [];
    subjects.forEach(s => {
        if (!s.archived && s.notes) {
            s.notes.forEach(n => {
                allNotes.push({ ...n, subjectName: s.name });
            });
        }
    });

    return allNotes
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 4);
}

function calculateStats(subjects) {
    let totalNotes = 0;
    subjects.forEach(s => {
        if (!s.archived && s.notes) {
            totalNotes += s.notes.length;
        }
    });

    return {
        totalSubjects: subjects.filter(s => !s.archived).length,
        totalNotes
    };
}
