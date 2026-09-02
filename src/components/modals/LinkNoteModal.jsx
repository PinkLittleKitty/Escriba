import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Search, X, FileText, Check } from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { escapeHtml } from '../../utils/helpers.js';
import styles from './Modal.module.css';

export const LinkNoteModal = () => {
  const subjects = useNotesStore((state) => state.subjects);
  const modalData = useUIStore((state) => state.modalData);
  const closeModal = useUIStore((state) => state.closeModal);
  const addToast = useUIStore((state) => state.addToast);

  const [filter, setFilter] = useState('');
  const [customText, setCustomText] = useState(modalData?.selectedText || '');
  const [selectedNote, setSelectedNote] = useState(null);

  const allNotes = subjects
    .filter((s) => !s.archived)
    .flatMap((s) =>
      (s.notes || []).map((n) => ({
        ...n,
        subjectId: s.id,
        subjectName: s.name,
        subjectColor: s.color || 'var(--accent-blue)'
      }))
    );

  const filtered = allNotes.filter(
    (n) =>
      n.title.toLowerCase().includes(filter.toLowerCase()) ||
      n.subjectName.toLowerCase().includes(filter.toLowerCase())
  );

  const handleInsertLink = (targetNote = selectedNote) => {
    if (!targetNote) {
      addToast({ message: 'Seleccioná un apunte para vincular', type: 'warning' });
      return;
    }

    const noteTitle = targetNote.title || 'Apunte';
    const textToShow = customText.trim() ? customText.trim() : `[[${noteTitle}]]`;
    const linkHTML = `<a href="#note-${targetNote.id}" data-note-id="${targetNote.id}" class="internal-link" title="Abrir apunte: ${noteTitle}">${escapeHtml(textToShow)}</a>&nbsp;`;

    const editorEl = document.querySelector('[contenteditable="true"]:not(th):not(td)');
    if (editorEl) {
      editorEl.focus();
    }

    const sel = window.getSelection();
    if (modalData?.savedRange) {
      try {
        sel.removeAllRanges();
        sel.addRange(modalData.savedRange);
      } catch (err) {
        console.warn('Could not restore saved range:', err);
      }
    }

    document.execCommand('insertHTML', false, linkHTML);

    if (editorEl) {
      editorEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    addToast({ message: `Enlace creado hacia "${noteTitle}"`, type: 'success' });
    closeModal();
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <LinkIcon size={18} color="var(--accent-blue)" />
            <span>Vincular Apunte</span>
          </h3>
          <button type="button" className={styles.closeBtn} onClick={closeModal} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup} style={{ marginBottom: '0.85rem' }}>
            <label className={styles.label}>Texto a mostrar en el enlace (opcional)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="ej: este concepto, polimorfismo, ver tema..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
              {customText.trim()
                ? `Se mostrará "${customText.trim()}" apuntando a la nota seleccionada.`
                : 'Si lo dejás vacío, se mostrará [[Título de la Nota]].'}
            </span>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '0.85rem' }}>
            <label className={styles.label}>Buscar apunte de destino</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className={styles.input}
                placeholder="Buscar por título o materia..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              maxHeight: '220px',
              overflowY: 'auto',
              paddingRight: '2px'
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No se encontraron apuntes con ese término.
              </div>
            ) : (
              filtered.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    style={{
                      padding: '0.55rem 0.75rem',
                      background: isSelected ? 'var(--accent-blue-bg, rgba(67, 97, 238, 0.15))' : 'var(--bg-tertiary)',
                      border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => {
                      setSelectedNote(note);
                      handleInsertLink(note);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <FileText size={14} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {note.title || 'Sin título'}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.725rem',
                        color: 'var(--text-muted)',
                        padding: '1px 6px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '3px',
                        flexShrink: 0
                      }}
                    >
                      {note.subjectName}
                    </span>
                  </div>
                );
              })
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
