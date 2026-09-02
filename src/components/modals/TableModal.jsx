import React, { useState } from 'react';
import { Table, X, Check, Plus } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore.js';
import styles from './Modal.module.css';

export const TableModal = () => {
  const closeModal = useUIStore((state) => state.closeModal);
  const addToast = useUIStore((state) => state.addToast);

  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hasHeader, setHasHeader] = useState(true);
  const [hoveredCell, setHoveredCell] = useState({ r: 3, c: 3 });

  const maxGrid = 8;

  const handleGridHover = (r, c) => {
    setHoveredCell({ r, c });
    setRows(r);
    setCols(c);
  };

  const handleInsert = (e) => {
    e?.preventDefault();

    const r = Math.max(1, Math.min(30, parseInt(rows, 10) || 3));
    const c = Math.max(1, Math.min(20, parseInt(cols, 10) || 3));

    let html = '<table class="editable-table">';

    if (hasHeader) {
      html += '<thead><tr>';
      for (let j = 0; j < c; j++) {
        html += `<th contenteditable="true">Encabezado ${j + 1}</th>`;
      }
      html += '</tr></thead>';
    }

    html += '<tbody>';
    const bodyRows = hasHeader ? r - 1 : r;
    const finalRows = bodyRows > 0 ? bodyRows : 1;

    for (let i = 0; i < finalRows; i++) {
      html += '<tr>';
      for (let j = 0; j < c; j++) {
        html += '<td contenteditable="true"><br></td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';

    const noteContent = document.querySelector('[contenteditable="true"]:not(th):not(td)');
    if (noteContent) {
      noteContent.focus();
      const sel = window.getSelection();
      let inserted = false;

      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (noteContent.contains(range.commonAncestorContainer)) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const frag = document.createDocumentFragment();
          let node;
          while ((node = tempDiv.firstChild)) {
            frag.appendChild(node);
          }
          range.deleteContents();
          range.insertNode(frag);
          inserted = true;
        }
      }

      if (!inserted) {
        document.execCommand('insertHTML', false, html);
      }

      noteContent.dispatchEvent(new Event('input', { bubbles: true }));
    }

    addToast({ message: `Tabla de ${r}×${c} insertada`, type: 'success' });
    closeModal();
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <Table size={18} color="var(--accent-blue)" />
            <span>Insertar Tabla</span>
          </h3>
          <button type="button" className={styles.closeBtn} onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleInsert} className={styles.modalForm}>
          <div className={styles.modalBody}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Seleccionar tamaño: <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{rows} × {cols}</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${maxGrid}, 1fr)`,
                  gap: '4px',
                  background: 'var(--bg-tertiary)',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  width: 'fit-content'
                }}
                onMouseLeave={() => setHoveredCell({ r: rows, c: cols })}
              >
                {Array.from({ length: maxGrid }).map((_, rIdx) =>
                  Array.from({ length: maxGrid }).map((_, cIdx) => {
                    const r = rIdx + 1;
                    const c = cIdx + 1;
                    const isHighlighted = r <= hoveredCell.r && c <= hoveredCell.c;
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseEnter={() => handleGridHover(r, c)}
                        onClick={handleInsert}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '3px',
                          border: isHighlighted ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                          background: isHighlighted ? 'var(--accent-blue-subtle, rgba(59, 130, 246, 0.25))' : 'var(--bg-card)',
                          cursor: 'pointer',
                          transition: 'all 0.1s ease'
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Filas</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className={styles.input}
                  value={rows}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setRows(val);
                    setHoveredCell({ r: val, c: cols });
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Columnas</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className={styles.input}
                  value={cols}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setCols(val);
                    setHoveredCell({ r: rows, c: val });
                  }}
                />
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
              <span>Incluir fila de encabezado</span>
            </label>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={15} />
              <span>Insertar Tabla</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
