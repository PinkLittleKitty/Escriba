import React from 'react';
import {
  BookOpen,
  FileText,
  Clock,
  CalendarCheck,
  GraduationCap,
  Plus,
  History,
  PieChart,
  Network,
  Star,
  ArrowRight
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { formatDate, parseLocalDate } from '../../utils/helpers.js';
import styles from './Dashboard.module.css';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_INDEX_MAP = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6
};

function getNextClass(subjects) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const allScheduleItems = [];

  subjects.forEach((s) => {
    if (!s.archived && Array.isArray(s.schedule)) {
      s.schedule.forEach((item) => {
        let dayIndex = 0;
        if (typeof item.day === 'number') {
          dayIndex = item.day % 7;
        } else if (typeof item.day === 'string') {
          const norm = item.day.toLowerCase().trim();
          dayIndex = DAY_INDEX_MAP[norm] !== undefined ? DAY_INDEX_MAP[norm] : 1;
        }

        const timeStr = item.startTime || item.time || '';
        if (!timeStr || typeof timeStr !== 'string') return;
        const timeParts = timeStr.split(':');
        if (timeParts.length < 2) return;

        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        if (isNaN(hours) || isNaN(minutes)) return;

        const classTimeInMinutes = hours * 60 + minutes;

        allScheduleItems.push({
          subjectId: s.id,
          subjectName: s.name,
          subjectColor: s.color || 'var(--accent-blue)',
          subjectCode: s.code || '',
          classroom: item.classroom || '',
          day: dayIndex,
          dayName: DAY_NAMES[dayIndex],
          startTime: timeStr,
          endTime: item.endTime || '',
          timeInMinutes: classTimeInMinutes
        });
      });
    }
  });

  if (allScheduleItems.length === 0) return null;

  allScheduleItems.sort((a, b) => {
    let diffA = (a.day - currentDay + 7) % 7;
    let diffB = (b.day - currentDay + 7) % 7;

    if (diffA === 0 && a.timeInMinutes < currentMinutes) diffA = 7;
    if (diffB === 0 && b.timeInMinutes < currentMinutes) diffB = 7;

    if (diffA !== diffB) return diffA - diffB;
    return a.timeInMinutes - b.timeInMinutes;
  });

  const next = allScheduleItems[0];
  const daysDiff = (next.day - currentDay + 7) % 7;

  let timeUntil = '';
  let isNow = false;

  if (daysDiff === 0 && next.timeInMinutes >= currentMinutes) {
    const diffMin = next.timeInMinutes - currentMinutes;
    if (diffMin <= 15) {
      isNow = true;
      timeUntil = '¡Ahora!';
    } else if (diffMin < 60) {
      timeUntil = `${diffMin} min`;
    } else {
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      timeUntil = m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
  } else if (daysDiff === 1) {
    timeUntil = 'Mañana';
  } else {
    timeUntil = `${daysDiff} ${daysDiff === 1 ? 'día' : 'días'}`;
  }

  return {
    ...next,
    isToday: daysDiff === 0,
    isNow,
    timeUntil
  };
}

function getUpcomingExams(events = [], subjects = []) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const subjectMap = new Map();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  return events
    .filter((e) => {
      if (!e.date) return false;
      const d = parseLocalDate(e.date);
      return d && d >= now;
    })
    .map((e) => {
      const d = parseLocalDate(e.date);
      const sub = e.subjectId ? subjectMap.get(e.subjectId) : null;
      return {
        ...e,
        parsedDate: d,
        subjectName: sub ? sub.name : '',
        subjectColor: sub ? sub.color : 'var(--accent-blue)'
      };
    })
    .sort((a, b) => a.parsedDate - b.parsedDate)
    .slice(0, 4);
}

export const DashboardView = () => {
  const subjects = useNotesStore((state) => state.subjects);
  const events = useNotesStore((state) => state.events);
  const setActiveNote = useNotesStore((state) => state.setActiveNote);
  const setActiveSubject = useNotesStore((state) => state.setActiveSubject);
  const setActiveView = useNotesStore((state) => state.setActiveView);
  const addNote = useNotesStore((state) => state.addNote);

  const openModal = useUIStore((state) => state.openModal);
  const setSidebarView = useUIStore((state) => state.setSidebarView);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);

  const now = new Date();
  const hour = now.getHours();
  let greeting = '¡Buenas noches!';
  if (hour >= 5 && hour < 12) greeting = '¡Buenos días!';
  else if (hour >= 12 && hour < 19) greeting = '¡Buenas tardes!';

  const rawDateStr = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateStr = rawDateStr.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

  const activeSubjects = subjects.filter((s) => !s.archived);
  const totalSubjects = activeSubjects.length;

  const allNotes = activeSubjects.flatMap((s) =>
    (s.notes || []).map((n) => ({
      ...n,
      subject: s,
      subjectId: s.id,
      subjectName: s.name,
      subjectColor: s.color
    }))
  );

  const totalNotes = allNotes.length;
  const recentNotes = [...allNotes]
    .sort((a, b) => {
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 4);

  const nextClass = getNextClass(subjects);
  const upcomingExams = getUpcomingExams(events, subjects);

  const handleCreateNewNote = () => {
    const targetSubId = activeSubjects[0]?.id;
    if (!targetSubId) {
      openModal('subject');
      return;
    }
    const note = addNote(targetSubId, { title: 'Nuevo Apunte' });
    if (note) {
      setActiveNote(targetSubId, note.id);
      setActiveView('editor');
    }
  };

  const handleViewAllNotes = () => {
    setSidebarView('recent');
    setSidebarCollapsed(false);
    if (recentNotes.length > 0) {
      setActiveNote(recentNotes[0].subject.id, recentNotes[0].id);
    } else {
      setActiveView('editor');
    }
  };

  const handleOpenSubjectModal = (subjectId) => {
    if (subjectId) {
      const sub = subjects.find((s) => s.id === subjectId);
      if (sub) {
        openModal('subject', sub);
        return;
      }
    }
    openModal('subject');
  };

  return (
    <div className={styles.dashboardScreen}>
      <div className={styles.dashboardHeader}>
        <div className={styles.dashboardGreeting}>
          <h2 className={styles.greetingText}>{greeting}</h2>
          <div className={styles.dashboardDate}>{dateStr}</div>
        </div>
      </div>

      <div className={styles.dashboardContent}>
        <div className={styles.dashboardMainCol}>
          <div className={`${styles.dashboardCard} ${styles.nextClassHero}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <GraduationCap size={18} color="var(--accent-blue)" />
                <span>Próxima Clase</span>
              </div>
            </div>

            <div className={styles.heroBody}>
              {nextClass ? (
                <>
                  <div className={styles.heroMain}>
                    <div className={styles.countdownBig}>
                      {nextClass.isNow ? '¡Ahora!' : nextClass.timeUntil}
                    </div>
                    <div
                      className={styles.subjectHighlight}
                      onClick={() => {
                        setActiveSubject(nextClass.subjectId);
                        setActiveView('editor');
                      }}
                    >
                      {nextClass.subjectName}
                    </div>
                  </div>
                  <div className={styles.heroFooter}>
                    <Clock size={16} />
                    <span>
                      {nextClass.isToday ? 'Hoy' : nextClass.dayName} a las {nextClass.startTime}
                      {nextClass.classroom ? ` • Aula ${nextClass.classroom}` : ''}
                    </span>
                  </div>
                </>
              ) : (
                <div className={styles.emptyHero}>
                  <p>No hay clases programadas para los próximos días.</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenSubjectModal()}
                  >
                    Configurar horarios
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`${styles.dashboardCard} ${styles.recentSectionCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <History size={18} color="var(--accent-blue)" />
                <span>Apuntes recientes</span>
              </div>
              {recentNotes.length > 0 && (
                <button
                  type="button"
                  className={styles.cardActionBtn}
                  onClick={handleViewAllNotes}
                >
                  <span>Ver todos</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {recentNotes.length === 0 ? (
              <p className={styles.emptyState}>No tenés apuntes creados aún.</p>
            ) : (
              <div className={styles.recentGrid}>
                {recentNotes.map((note) => {
                  const snippet = note.content
                    ? note.content.replace(/<[^>]*>?/gm, '').trim()
                    : '';

                  return (
                    <div
                      key={note.id}
                      className={styles.noteCard}
                      onClick={() => {
                        setActiveNote(note.subject.id, note.id);
                        setActiveView('editor');
                      }}
                    >
                      <div
                        className={styles.noteCardHeader}
                        style={{ backgroundColor: note.subject.color || 'var(--accent-blue)' }}
                      />
                      <div className={styles.noteCardBody}>
                        <span className={styles.noteCardSubject}>{note.subject.name}</span>
                        <h3 className={styles.noteCardTitle}>{note.title || 'Apunte sin título'}</h3>
                        <p className={styles.noteCardSnippet}>
                          {snippet || 'Sin contenido adicional...'}
                        </p>
                        <div className={styles.noteCardFooter}>
                          <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                          {note.favorite && <Star size={13} fill="currentColor" color="var(--accent-yellow)" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.dashboardSideCol}>
          <div className={`${styles.dashboardCard} ${styles.examsCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <CalendarCheck size={18} color="var(--accent-blue)" />
                <span>Próximos Exámenes</span>
              </div>
              <button
                type="button"
                className={styles.btnIconSm}
                onClick={() => openModal('event')}
                title="Agregar Examen"
              >
                <Plus size={15} />
              </button>
            </div>

            <div className={styles.dashboardList}>
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam) => {
                  const dayNum = exam.parsedDate ? exam.parsedDate.getDate() : '';
                  const monthStr = exam.parsedDate
                    ? exam.parsedDate.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
                    : '';

                  return (
                    <div
                      key={exam.id}
                      className={styles.listItem}
                      onClick={() => openModal('event', { event: exam })}
                      title="Editar o eliminar examen"
                    >
                      <div className={styles.itemDateMini}>
                        <span className={styles.itemDay}>{dayNum}</span>
                        <span className={styles.itemMonth}>{monthStr}</span>
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemTitleRow}>
                          <span className={styles.itemTitle}>{exam.title}</span>
                          {exam.type && (
                            <span className={`${styles.typeTag} ${styles[`tag_${exam.type}`] || styles[`tag_${exam.type.toLowerCase()}`] || ''}`}>
                              {exam.type}
                            </span>
                          )}
                        </div>
                        <span className={styles.itemSubtitle}>
                          {exam.subjectName || exam.notes || 'Sin notas adicionales'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className={styles.emptyState}>No hay exámenes próximos.</p>
              )}
            </div>
          </div>

          <div className={`${styles.dashboardCard} ${styles.statsCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <PieChart size={18} color="var(--accent-blue)" />
                <span>Resumen</span>
              </div>
            </div>

            <div className={styles.statsCompactGrid}>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <BookOpen size={16} color="var(--accent-blue)" />
                </div>
                <div className={styles.statText}>
                  <span className={styles.statVal}>{totalSubjects}</span>
                  <span className={styles.statLabel}>MATERIAS</span>
                </div>
              </div>

              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <FileText size={16} color="var(--accent-blue)" />
                </div>
                <div className={styles.statText}>
                  <span className={styles.statVal}>{totalNotes}</span>
                  <span className={styles.statLabel}>APUNTES</span>
                </div>
              </div>
            </div>

            <div className={styles.statsFooterActions}>
              <button
                type="button"
                className={`btn btn-primary ${styles.btnFull}`}
                onClick={handleCreateNewNote}
              >
                <Plus size={16} />
                <span>Nuevo Apunte</span>
              </button>

              <button
                type="button"
                className={`btn btn-secondary ${styles.btnFull}`}
                onClick={() => openModal('knowledgeGraph')}
                title="Ver Minimapa de Red"
              >
                <Network size={16} />
                <span>Minimapa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

