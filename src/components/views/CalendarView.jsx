import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { SubjectBadge } from '../common/SubjectBadge.jsx';
import styles from './Calendar.module.css';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_SPANISH = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const CalendarView = () => {
  const subjects = useNotesStore((state) => state.subjects);
  const events = useNotesStore((state) => state.events);
  const deleteEvent = useNotesStore((state) => state.deleteEvent);
  const openModal = useUIStore((state) => state.openModal);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const calendarCells = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = totalDaysInPrevMonth - i;
    calendarCells.push({
      day,
      date: new Date(year, month - 1, day),
      isCurrentMonth: false
    });
  }

  for (let day = 1; day <= totalDaysInMonth; day++) {
    calendarCells.push({
      day,
      date: new Date(year, month, day),
      isCurrentMonth: true
    });
  }

  const remainingCells = 42 - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    calendarCells.push({
      day,
      date: new Date(year, month + 1, day),
      isCurrentMonth: false
    });
  }

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDayEvents = events.filter((e) => e.date === selectedDateStr);
  const selectedDayIndex = selectedDate.getDay();

  const normalizeScheduleDay = (day) => {
    if (day === null || day === undefined) return -1;
    if (typeof day === 'number') {
      if (day >= 1 && day <= 6) return day;
      if (day === 7 || day === 0) return 0;
      return day % 7;
    }
    const str = String(day)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (/^(dom|domingo|0|7)$/.test(str)) return 0;
    if (/^(lun|lunes|1)$/.test(str)) return 1;
    if (/^(mar|martes|2)$/.test(str)) return 2;
    if (/^(mie|miercoles|3)$/.test(str)) return 3;
    if (/^(jue|jueves|4)$/.test(str)) return 4;
    if (/^(vie|viernes|5)$/.test(str)) return 5;
    if (/^(sab|sabado|6)$/.test(str)) return 6;
    return -1;
  };

  const selectedDayClasses = [];
  subjects.filter((s) => !s.archived).forEach((sub) => {
    if (Array.isArray(sub.schedule)) {
      sub.schedule.forEach((sch) => {
        if (normalizeScheduleDay(sch.day) === selectedDayIndex) {
          selectedDayClasses.push({
            subject: sub,
            subjectName: sub.name,
            color: sub.color,
            classroom: sch.classroom,
            startTime: sch.startTime || sch.time || '',
            endTime: sch.endTime || ''
          });
        }
      });
    }
  });

  selectedDayClasses.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarMain}>
        <div className={styles.calendarHeader}>
          <div className={styles.monthNav}>
            <h2 className={styles.currentMonthTitle}>
              {MONTH_NAMES[month]} {year}
            </h2>
            <button type="button" className="btn btn-icon" onClick={handlePrevMonth} title="Mes anterior">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className="btn btn-icon" onClick={handleNextMonth} title="Mes siguiente">
              <ChevronRight size={20} />
            </button>
          </div>

          <button type="button" className="btn btn-secondary" onClick={handleToday}>
            Hoy
          </button>
        </div>

        <div className={styles.weekdaysHeader}>
          {WEEKDAY_NAMES.map((w, idx) => (
            <div key={idx} className={styles.weekdayName}>
              {w}
            </div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {calendarCells.map((cell, idx) => {
            const cellDateStr = cell.date.toISOString().split('T')[0];
            const isToday = cellDateStr === new Date().toISOString().split('T')[0];
            const isSelected = cellDateStr === selectedDateStr;

            const dayEvents = events.filter((e) => e.date === cellDateStr);

            return (
              <div
                key={idx}
                className={`${styles.dayCell} ${!cell.isCurrentMonth ? styles.outsideMonth : ''} ${isToday ? styles.today : ''
                  } ${isSelected ? styles.selected : ''}`}
                onClick={() => setSelectedDate(cell.date)}
              >
                <span className={styles.dayNumber}>{cell.day}</span>
                {dayEvents.slice(0, 2).map((ev) => {
                  const evSubject = subjects.find((s) => s.id === ev.subjectId);
                  return (
                    <div
                      key={ev.id}
                      className={styles.eventPill}
                      style={{
                        background: evSubject?.color ? `${evSubject.color}22` : 'var(--accent-blue-bg)',
                        color: evSubject?.color || 'var(--accent-blue)',
                        borderLeft: `2px solid ${evSubject?.color || 'var(--accent-blue)'}`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('event', { event: ev });
                      }}
                      title={`${ev.title} (Click para editar)`}
                    >
                      <span>{ev.title}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    +{dayEvents.length - 2} más
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.sidebarPanel}>
        <div className={styles.panelTitle}>
          <CalendarIcon size={18} />
          <span>
            {selectedDate.toLocaleDateString('es-AR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </span>
        </div>

        {selectedDayClasses.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              HORARIOS DE CURSADA
            </h4>
            <div className={styles.eventList}>
              {selectedDayClasses.map((c, i) => (
                <div
                  key={i}
                  className={styles.eventCard}
                  style={{ borderLeft: `3px solid ${c.color || 'var(--accent-blue)'}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                    {c.subject && <SubjectBadge subject={c.subject} size="sm" />}
                    <span className={styles.eventTitle}>{c.subjectName}</span>
                  </div>
                  <div className={styles.eventMeta}>
                    <Clock size={12} />
                    <span>
                      {c.startTime && c.endTime
                        ? `${c.startTime} - ${c.endTime}`
                        : (c.startTime ? `A las ${c.startTime}` : 'Horario a confirmar')}
                      {c.classroom ? ` • Aula ${c.classroom}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}
          >
            <h4 style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>EVENTOS Y EXÁMENES</h4>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              onClick={() => openModal('event', { date: selectedDateStr })}
            >
              <Plus size={13} />
              <span>Nuevo</span>
            </button>
          </div>

          <div className={styles.eventList}>
            {selectedDayEvents.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                No hay eventos anotados para este día.
              </div>
            ) : (
              selectedDayEvents.map((ev) => {
                const evSubject = subjects.find((s) => s.id === ev.subjectId);
                return (
                  <div
                    key={ev.id}
                    className={styles.eventCard}
                    style={{
                      borderLeft: `3px solid ${evSubject?.color || 'var(--accent-blue)'}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => openModal('event', { event: ev })}
                    title="Click para editar o eliminar"
                  >
                    <div className={styles.eventHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        {evSubject && <SubjectBadge subject={evSubject} size="sm" />}
                        <span className={styles.eventTitle}>{ev.title}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Eliminar "${ev.title}"?`)) {
                            deleteEvent(ev.id);
                          }
                        }}
                        title="Eliminar evento"
                      >
                        <Trash2 size={13} color="var(--accent-red)" />
                      </button>
                    </div>
                    {evSubject && (
                      <div style={{ fontSize: '0.75rem', color: evSubject.color, fontWeight: 600, marginTop: '2px' }}>
                        {evSubject.name}
                      </div>
                    )}
                    {ev.time && (
                      <div className={styles.eventMeta}>
                        <Clock size={12} />
                        <span>{ev.time} hs</span>
                      </div>
                    )}
                    {ev.notes && (
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {ev.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
