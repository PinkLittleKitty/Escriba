import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  X,
  Trash2,
  Save,
  BarChart2,
  Target,
  FileCheck,
  RotateCcw,
  BookOpen,
  Pin
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import styles from './EventModal.module.css';

const EVENT_TYPES = [
  { id: 'parcial', label: 'Parcial', icon: BarChart2, color: 'var(--accent-blue, #3b82f6)' },
  { id: 'final', label: 'Final', icon: Target, color: 'var(--accent-purple, #a855f7)' },
  { id: 'tp', label: 'TP / Entrega', icon: FileCheck, color: 'var(--accent-cyan, #06b6d4)' },
  { id: 'recuperatorio', label: 'Recuperatorio', icon: RotateCcw, color: 'var(--accent-yellow, #eab308)' },
  { id: 'tarea', label: 'Tarea / Exp.', icon: BookOpen, color: 'var(--accent-green, #10b981)' },
  { id: 'otro', label: 'Otro', icon: Pin, color: 'var(--text-secondary, #94a3b8)' }
];

export const EventModal = () => {
  const subjects = useNotesStore((state) => state.subjects);
  const activeSubjectId = useNotesStore((state) => state.activeSubjectId);
  const addEvent = useNotesStore((state) => state.addEvent);
  const updateEvent = useNotesStore((state) => state.updateEvent);
  const deleteEvent = useNotesStore((state) => state.deleteEvent);

  const modalData = useUIStore((state) => state.modalData);
  const closeModal = useUIStore((state) => state.closeModal);
  const addToast = useUIStore((state) => state.addToast);

  const editingEvent = modalData?.event || null;
  const isEditing = !!editingEvent;

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('parcial');
  const [notes, setNotes] = useState('');

  const activeSubjects = subjects.filter((s) => !s.archived || s.id === editingEvent?.subjectId);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || '');
      setSubjectId(editingEvent.subjectId || '');
      setDate(editingEvent.date || '');
      setTime(editingEvent.time || '');
      setType(editingEvent.type || 'parcial');
      setNotes(editingEvent.notes || '');
    } else {
      const todayStr = modalData?.date || new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setSubjectId(modalData?.subjectId || activeSubjectId || activeSubjects[0]?.id || '');
      setType(modalData?.type || 'parcial');
      setTitle('');
      setTime('');
      setNotes('');
    }
  }, [editingEvent, modalData, activeSubjectId, subjects]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast({ message: 'Ingresá un título para el evento', type: 'warning' });
      return;
    }
    if (!date) {
      addToast({ message: 'Seleccioná una fecha válida', type: 'warning' });
      return;
    }

    if (isEditing) {
      updateEvent(editingEvent.id, {
        title: title.trim(),
        subjectId: subjectId || null,
        date,
        time,
        type,
        notes: notes.trim()
      });
      addToast({ message: 'Examen actualizado con éxito', type: 'success' });
    } else {
      addEvent({
        title: title.trim(),
        subjectId: subjectId || null,
        date,
        time,
        type,
        notes: notes.trim()
      });
      addToast({ message: 'Examen programado con éxito', type: 'success' });
    }

    closeModal();
  };

  const handleDelete = () => {
    if (!editingEvent) return;
    if (window.confirm(`¿Eliminar el examen "${editingEvent.title}"?`)) {
      deleteEvent(editingEvent.id);
      addToast({ message: 'Examen eliminado', type: 'info' });
      closeModal();
    }
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.titleRow}>
            <CalendarIcon size={18} color="var(--accent-blue)" />
            <h3>{isEditing ? 'Editar Examen / Evento' : 'Nuevo Examen / Evento'}</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={closeModal} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Título del Evento o Examen *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="ej: 1er Parcial, Entrega TP 2, Examen Final..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Materia Asociada</label>
              <select
                className={styles.select}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">(Sin materia asignada)</option>
                {activeSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} {sub.code ? `(${sub.code})` : ''} {sub.archived ? '(Archivada)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hora (opcional)</label>
                <input
                  type="time"
                  className={styles.input}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo de Evento</label>
              <div className={styles.typeGrid}>
                {EVENT_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isActive = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`${styles.typeBtn} ${isActive ? styles.active : ''}`}
                      onClick={() => setType(t.id)}
                    >
                      <Icon size={13} color={isActive ? 'var(--accent-blue)' : t.color} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Notas / Temas a Evaluar (opcional)</label>
              <textarea
                className={styles.textarea}
                placeholder="Temas de la cursada, aula, llevar calculadora..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            {isEditing && (
              <button
                type="button"
                className="btn btn-danger-subtle"
                onClick={handleDelete}
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </button>
            )}

            <div className={styles.footerActionsRight}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary"
              >
                <Save size={14} />
                <span>{isEditing ? 'Guardar Cambios' : 'Crear Evento'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
