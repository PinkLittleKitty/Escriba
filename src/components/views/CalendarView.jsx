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
  const addEvent = useNotesStore((state) => state.addEvent);
  const deleteEvent = useNotesStore((state) => state.deleteEvent);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventSubjectId, setEventSubjectId] = useState('');
  const [eventType, setEventType] = useState('exam');

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

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    addEvent({
      title: eventTitle,
      date: dateStr,
      time: eventTime,
      subjectId: eventSubjectId || null,
      type: eventType
    });

    setEventTitle('');
    setEventTime('');
    setShowEventForm(false);
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
  const selectedDayName = DAYS_SPANISH[selectedDate.getDay()];

  const selectedDayClasses = [];
  subjects.forEach((sub) => {
    if (Array.isArray(sub.schedule)) {
      sub.schedule.forEach((sch) => {
        if (sch.day === selectedDayName) {
          selectedDayClasses.push({
            subjectName: sub.name,
            color: sub.color,
            classroom: sch.classroom,
            startTime: sch.startTime,
            endTime: sch.endTime
          });
        }
      });
    }
  });

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
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className={styles.eventPill}
                    style={{
                      background:
                        ev.type === 'exam' ? 'var(--accent-red-bg)' : 'var(--accent-blue-bg)',
                      color: ev.type === 'exam' ? 'var(--accent-red)' : 'var(--accent-blue)'
                    }}
                  >
                    <span>{ev.title}</span>
                  </div>
                ))}
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
                  <span className={styles.eventTitle}>{c.subjectName}</span>
                  <div className={styles.eventMeta}>
                    <Clock size={12} />
                    <span>
                      {c.startTime} - {c.endTime} {c.classroom ? `• Aula ${c.classroom}` : ''}
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
              onClick={() => setShowEventForm(!showEventForm)}
            >
              <Plus size={13} />
              <span>Nuevo</span>
            </button>
          </div>

          {showEventForm && (
            <form
              onSubmit={handleCreateEvent}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <input
                type="text"
                placeholder="Título del evento / examen"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                style={{
                  padding: '0.4rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)'
                }}
                required
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <option value="exam">Examen / Parcial</option>
                  <option value="assignment">Entrega / TP</option>
                  <option value="class">Clase extra</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setShowEventForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  Guardar
                </button>
              </div>
            </form>
          )}

          <div className={styles.eventList}>
            {selectedDayEvents.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                No hay eventos anotados para este día.
              </div>
            ) : (
              selectedDayEvents.map((ev) => (
                <div key={ev.id} className={styles.eventCard}>
                  <div className={styles.eventHeader}>
                    <span className={styles.eventTitle}>{ev.title}</span>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => deleteEvent(ev.id)}
                      title="Eliminar evento"
                    >
                      <Trash2 size={13} color="var(--accent-red)" />
                    </button>
                  </div>
                  {ev.time && (
                    <div className={styles.eventMeta}>
                      <Clock size={12} />
                      <span>{ev.time} hs</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
