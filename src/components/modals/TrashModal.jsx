import React from 'react';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { formatDate } from '../../utils/helpers.js';
import styles from './Modal.module.css';

export const TrashModal = () => {
  const deletedItems = useNotesStore((state) => state.deletedItems);
  const restoreItem = useNotesStore((state) => state.restoreItem);
  const emptyTrash = useNotesStore((state) => state.emptyTrash);

  const closeModal = useUIStore((state) => state.closeModal);
  const addToast = useUIStore((state) => state.addToast);

  const handleRestore = (id) => {
    restoreItem(id);
    addToast({ message: 'Elemento restaurado', type: 'success' });
  };

  const handleEmpty = () => {
    if (window.confirm('¿Estás seguro de vaciar permanentemente la papelera? Esta acción no se puede deshacer.')) {
      emptyTrash();
      addToast({ message: 'Papelera vaciada', type: 'info' });
      closeModal();
    }
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <Trash2 size={20} color="var(--accent-red)" />
            <span>Papelera de reciclaje</span>
          </h3>
          <button type="button" className={styles.closeBtn} onClick={closeModal} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {deletedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              La papelera está vacía.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {deletedItems.map((del) => {
                const title =
                  del.type === 'subject'
                    ? `Materia: ${del.item?.name}`
                    : `Apunte: ${del.item?.title || 'Sin título'}`;

                return (
                  <div
                    key={del.id}
                    style={{
                      background: 'var(--bg-tertiary)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Eliminado: {formatDate(del.deletedAt)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      onClick={() => handleRestore(del.id)}
                    >
                      <RotateCcw size={13} />
                      <span>Restaurar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {deletedItems.length > 0 && (
            <button
              type="button"
              className="btn btn-danger-subtle"
              style={{ marginRight: 'auto' }}
              onClick={handleEmpty}
            >
              <Trash2 size={15} />
              <span>Vaciar Papelera</span>
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
