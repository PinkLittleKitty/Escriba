import React, { useState } from 'react';
import { Link as LinkIcon, Search, X, FileText } from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import styles from './Modal.module.css';

export const LinkNoteModal = () => {
  const subjects = useNotesStore((state) => state.subjects);
  const closeModal = useUIStore((state) => state.closeModal);
  const [filter, setFilter] = useState('');

  const allNotes = subjects.flatMap((s) => s.notes.map((n) => ({ ...n, subjectName: s.name })));
  const filtered = allNotes.filter((n) =>
    n.title.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSelect = (note) => {
    const linkHTML = `<a href="#note-${note.id}" data-note-id="${note.id}" style="color: var(--accent-blue); text-decoration: underline; font-weight: 500;">[[${note.title}]]</a>&nbsp;`;
    document.execCommand('insertHTML', false, linkHTML);
    closeModal();
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <LinkIcon size={18} color="var(--accent-blue)" />
            <span>Enlazar otro apunte</span>
          </h3>
          <button type="button" className={styles.closeBtn} onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <input
              type="text"
              className={styles.input}
              placeholder="Buscar apunte para vincular..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '250px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                No se encontraron apuntes.
              </div>
            ) : (
              filtered.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: '0.6rem 0.75rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSelect(note)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={14} color="var(--accent-blue)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{note.title}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{note.subjectName}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
