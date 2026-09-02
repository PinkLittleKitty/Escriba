import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Archive,
  ArchiveRestore,
  Sparkles,
  Palette,
  Calendar,
  Layers,
  Edit3
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { ColorPicker } from '../common/ColorPicker.jsx';
import { SubjectBadge } from '../common/SubjectBadge.jsx';
import { IconPicker } from '../common/IconPicker.jsx';
import { getSubjectInitials } from '../../utils/subjectIcons.js';
import {
  DAYS_OF_WEEK,
  normalizeScheduleDay,
  normalizeScheduleItem
} from '../../utils/helpers.js';
import styles from './SubjectModal.module.css';

export const SubjectModal = () => {
  const modalData = useUIStore((state) => state.modalData);
  const closeModal = useUIStore((state) => state.closeModal);
  const addToast = useUIStore((state) => state.addToast);

  const addSubject = useNotesStore((state) => state.addSubject);
  const updateSubject = useNotesStore((state) => state.updateSubject);
  const deleteSubject = useNotesStore((state) => state.deleteSubject);
  const toggleArchiveSubject = useNotesStore((state) => state.toggleArchiveSubject);

  const isEditing = !!modalData?.id;

  const [activeTab, setActiveTab] = useState('general');
  const [name, setName] = useState(modalData?.name || '');
  const [code, setCode] = useState(modalData?.code || '');
  const [professor, setProfessor] = useState(modalData?.professor || '');
  const [color, setColor] = useState(modalData?.color || '#3b82f6');
  const [icon, setIcon] = useState(modalData?.icon || null);
  const [schedule, setSchedule] = useState(() => {
    return Array.isArray(modalData?.schedule)
      ? modalData.schedule.map(normalizeScheduleItem)
      : [];
  });

  useEffect(() => {
    if (modalData) {
      setName(modalData.name || '');
      setCode(modalData.code || '');
      setProfessor(modalData.professor || '');
      setColor(modalData.color || '#3b82f6');
      setIcon(modalData.icon || null);
      setSchedule(
        Array.isArray(modalData.schedule)
          ? modalData.schedule.map(normalizeScheduleItem)
          : []
      );
    } else {
      setName('');
      setCode('');
      setProfessor('');
      setColor('#3b82f6');
      setIcon(null);
      setSchedule([]);
    }
  }, [modalData]);

  const handleAddScheduleRow = () => {
    setSchedule([
      ...schedule,
      { day: 'Lunes', startTime: '09:00', endTime: '13:00', classroom: '' }
    ]);
  };

  const handleUpdateScheduleRow = (index, field, value) => {
    const updated = [...schedule];
    let val = value;
    if (field === 'day') val = normalizeScheduleDay(value);
    updated[index] = { ...updated[index], [field]: val };
    setSchedule(updated);
  };

  const handleRemoveScheduleRow = (index) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanSchedule = schedule
      .map(normalizeScheduleItem)
      .filter((s) => s.day && (s.startTime || s.classroom));

    if (isEditing) {
      updateSubject(modalData.id, { name, code, professor, color, schedule: cleanSchedule, icon });
      addToast({ message: 'Materia actualizada', type: 'success' });
    } else {
      addSubject({ name, code, professor, color, schedule: cleanSchedule, icon });
      addToast({ message: 'Materia creada', type: 'success' });
    }

    closeModal();
  };

  const handleDelete = () => {
    if (isEditing && window.confirm('¿Seguro que querés mandar esta materia a la papelera?')) {
      deleteSubject(modalData.id);
      addToast({ message: 'Materia enviada a la papelera', type: 'info' });
      closeModal();
    }
  };

  const badgeMode = icon ? 'icon' : 'text';

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.heroHeader}>
          <div
            className={styles.heroBackdropGlow}
            style={{
              background: `radial-gradient(circle at 12% 40%, ${color}40, transparent 70%)`
            }}
          />

          <div className={styles.heroContent}>
            <button
              type="button"
              className={styles.badgeButton}
              onClick={() => setActiveTab('icon')}
              title="Click para cambiar icono o insignia"
            >
              <SubjectBadge
                subject={{ name, code, color, icon }}
                size="lg"
              />
              <span className={styles.badgeEditHint} title="Editar icono">
                <Edit3 size={10} />
              </span>
            </button>

            <div className={styles.heroInfo}>
              <h3 className={styles.heroTitle}>
                {isEditing ? 'Editar Materia' : 'Nueva Materia'}
              </h3>

              <div className={styles.heroMeta}>
                {name.trim() ? <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span> : null}
                {code && <span className={styles.heroCodeBadge}>{code.toUpperCase()}</span>}
                {professor && <span>Prof. {professor}</span>}
                {schedule.length > 0 && (
                  <span>• {schedule.length} {schedule.length === 1 ? 'clase' : 'clases'}</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeModal}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <nav className={styles.tabBar} aria-label="Secciones de la materia">
            <button
              type="button"
              className={`${styles.tabItem} ${activeTab === 'general' ? styles.active : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <Sparkles size={14} />
              <span>Información</span>
            </button>

            <button
              type="button"
              className={`${styles.tabItem} ${activeTab === 'icon' ? styles.active : ''}`}
              onClick={() => setActiveTab('icon')}
            >
              <Palette size={14} />
              <span>Icono & Distintivo</span>
              {icon && <span className={styles.tabBadge}>Icono</span>}
            </button>

            <button
              type="button"
              className={`${styles.tabItem} ${activeTab === 'schedule' ? styles.active : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <Calendar size={14} />
              <span>Horarios</span>
              {schedule.length > 0 && (
                <span className={styles.tabBadge}>{schedule.length}</span>
              )}
            </button>
          </nav>

          <div
            className={styles.tabContent}
            style={{ display: activeTab === 'general' ? 'flex' : 'none' }}
          >
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de la Materia</label>
              <input
                type="text"
                className={styles.input}
                placeholder="ej: Algoritmos y Estructuras de Datos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus={!isEditing}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Código / Sigla</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="ej: AED"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className={styles.formGroup} style={{ flex: 1.5 }}>
                <label className={styles.label}>Profesor/a</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="ej: Lic. Gómez"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span>Color identificador</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                  Distintivo en barra lateral y calendario
                </span>
              </label>
              <ColorPicker selectedColor={color} onChange={setColor} />
            </div>
          </div>

          <div
            className={styles.tabContent}
            style={{ display: activeTab === 'icon' ? 'flex' : 'none' }}
          >
            <div className={styles.formGroup}>
              <IconPicker
                selectedIcon={icon}
                onChange={setIcon}
                color={color}
                allowClear={true}
                fallbackText={getSubjectInitials({ name, code })}
              />
            </div>
          </div>

          <div
            className={styles.tabContent}
            style={{ display: activeTab === 'schedule' ? 'flex' : 'none' }}
          >
            <div className={styles.scheduleHeader}>
              <label className={styles.label} style={{ margin: 0 }}>
                <span>Días y Horas de Cursada</span>
              </label>

              {schedule.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  onClick={handleAddScheduleRow}
                >
                  <Plus size={13} />
                  <span>Agregar Horario</span>
                </button>
              )}
            </div>

            {schedule.length > 0 ? (
              <div className={styles.scheduleList}>
                {schedule.map((row, idx) => (
                  <div key={idx} className={styles.scheduleCard}>
                    <div className={styles.scheduleCardTop}>
                      <select
                        className={styles.scheduleDaySelect}
                        value={row.day}
                        onChange={(e) => handleUpdateScheduleRow(idx, 'day', e.target.value)}
                        title="Día de cursada"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleRemoveScheduleRow(idx)}
                        title="Quitar"
                      >
                        <Trash2 size={14} color="var(--accent-red)" />
                      </button>
                    </div>

                    <div className={styles.scheduleCardBottom}>
                      <div className={styles.timeRangeGroup}>
                        <Clock size={13} color="var(--text-muted)" />
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={row.startTime || ''}
                          onChange={(e) => handleUpdateScheduleRow(idx, 'startTime', e.target.value)}
                          title="Hora de inicio"
                          aria-label="Hora de inicio"
                        />
                        <span className={styles.timeSeparator}>a</span>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={row.endTime || ''}
                          onChange={(e) => handleUpdateScheduleRow(idx, 'endTime', e.target.value)}
                          title="Hora de fin"
                          aria-label="Hora de fin"
                        />
                      </div>

                      <input
                        type="text"
                        className={styles.classroomInput}
                        placeholder="Aula / Comisión (opcional)"
                        value={row.classroom || ''}
                        onChange={(e) => handleUpdateScheduleRow(idx, 'classroom', e.target.value)}
                        title="Aula o comisión"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptySchedule}>
                <Clock size={28} color="var(--text-muted)" />
                <p>
                  No tenés horarios asignados a esta materia. Agregá tus días de cursada para ver recordatorios automáticos en el Inicio y Calendario.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={handleAddScheduleRow}
                >
                  <Plus size={14} />
                  <span>Agregar Horario</span>
                </button>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            {isEditing && (
              <div style={{ display: 'flex', gap: '0.5rem', marginRight: 'auto' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    toggleArchiveSubject(modalData.id);
                    addToast({
                      message: modalData.archived ? 'Materia desarchivada' : 'Materia archivada',
                      type: 'info'
                    });
                    closeModal();
                  }}
                  title={modalData.archived ? 'Desarchivar materia' : 'Archivar materia'}
                >
                  {modalData.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  <span>{modalData.archived ? 'Desarchivar' : 'Archivar'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-danger-subtle"
                  onClick={handleDelete}
                  title="Mover a papelera"
                >
                  <Trash2 size={15} />
                  <span>Eliminar</span>
                </button>
              </div>
            )}

            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Guardar Cambios' : 'Crear Materia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
