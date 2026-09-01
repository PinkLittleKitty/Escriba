import React, { useState } from 'react';
import { FolderPlus, X, Plus, Trash2, Clock, Archive, ArchiveRestore } from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { ColorPicker } from '../common/ColorPicker.jsx';
import styles from './Modal.module.css';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const SubjectModal = () => {
  const modalData = useUIStore((state) => state.modalData);
  const closeModal = useUIStore((state) => state.closeModal);
  const addToast = useUIStore((state) => state.addToast);

  const addSubject = useNotesStore((state) => state.addSubject);
  const updateSubject = useNotesStore((state) => state.updateSubject);
  const deleteSubject = useNotesStore((state) => state.deleteSubject);
  const toggleArchiveSubject = useNotesStore((state) => state.toggleArchiveSubject);

  const isEditing = !!modalData?.id;

  const [name, setName] = useState(modalData?.name || '');
  const [code, setCode] = useState(modalData?.code || '');
  const [professor, setProfessor] = useState(modalData?.professor || '');
  const [color, setColor] = useState(modalData?.color || '#3b82f6');
  const [schedule, setSchedule] = useState(modalData?.schedule || []);

  const handleAddScheduleRow = () => {
    setSchedule([
      ...schedule,
      { day: 'Lunes', startTime: '09:00', endTime: '13:00', classroom: '' }
    ]);
  };

  const handleUpdateScheduleRow = (index, field, value) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const handleRemoveScheduleRow = (index) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing) {
      updateSubject(modalData.id, { name, code, professor, color, schedule });
      addToast({ message: 'Materia actualizada', type: 'success' });
    } else {
      addSubject({ name, code, professor, color, schedule });
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

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FolderPlus size={20} color="var(--accent-blue)" />
            <span>{isEditing ? 'Editar Materia' : 'Nueva Materia'}</span>
          </h3>
          <button type="button" className={styles.closeBtn} onClick={closeModal} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de la Materia *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="ej: Algoritmos y Estructuras de Datos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
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

              <div className={styles.formGroup} style={{ flex: 2 }}>
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
              <label className={styles.label}>Color identificador</label>
              <ColorPicker selectedColor={color} onChange={setColor} />
            </div>

            <div className={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.label}>
                  <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Horarios de Cursada
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  onClick={handleAddScheduleRow}
                >
                  <Plus size={13} />
                  <span>Agregar Horario</span>
                </button>
              </div>

              {schedule.length > 0 && (
                <div className={styles.scheduleList}>
                  {schedule.map((row, idx) => (
                    <div key={idx} className={styles.scheduleRow}>
                      <select
                        value={row.day}
                        onChange={(e) => handleUpdateScheduleRow(idx, 'day', e.target.value)}
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <input
                        type="time"
                        value={row.startTime}
                        onChange={(e) => handleUpdateScheduleRow(idx, 'startTime', e.target.value)}
                      />

                      <input
                        type="time"
                        value={row.endTime}
                        onChange={(e) => handleUpdateScheduleRow(idx, 'endTime', e.target.value)}
                      />

                      <input
                        type="text"
                        placeholder="Aula / Comisión"
                        value={row.classroom || ''}
                        style={{ flex: 1 }}
                        onChange={(e) => handleUpdateScheduleRow(idx, 'classroom', e.target.value)}
                      />

                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleRemoveScheduleRow(idx)}
                        title="Quitar"
                      >
                        <Trash2 size={13} color="var(--accent-red)" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
