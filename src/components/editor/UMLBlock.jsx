import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { GitGraph, Eye, Code, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/helpers.js';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import styles from './UMLBlock.module.css';

export const UMLBlock = ({
  code = `graph TD\n  A[Inicio] --> B{¿Es correcto?}\n  B -->|Sí| C[Continuar]\n  B -->|No| D[Revisar]`,
  onChange,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [umlCode, setUmlCode] = useState(code);
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);

  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'light' || theme === 'sepia' ? 'default' : 'dark',
      securityLevel: 'loose'
    });

    const renderDiagram = async () => {
      try {
        const id = generateId('mermaid-svg');
        const { svg } = await mermaid.render(id, umlCode);
        setSvgContent(svg);
        setRenderError(null);
      } catch (err) {
        console.warn('Mermaid rendering error:', err);
        setRenderError(err.message || 'Error de sintaxis en diagrama UML');
      }
    };

    renderDiagram();
  }, [umlCode, theme]);

  const handleCodeChange = (e) => {
    const val = e.target.value;
    setUmlCode(val);
    if (onChange) onChange(val);
  };

  return (
    <div className={styles.umlContainer} contentEditable={false}>
      <div className={styles.umlHeader}>
        <div className={styles.headerLeft}>
          <GitGraph size={14} color="var(--accent-purple)" />
          <span>Diagrama UML / Mermaid</span>
        </div>

        <div className={styles.tabGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.active : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Eye size={12} />
            <span>Vista Previa</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'code' ? styles.active : ''}`}
            onClick={() => setActiveTab('code')}
          >
            <Code size={12} />
            <span>Código</span>
          </button>
        </div>

        <div className={styles.headerRight}>
          {onDelete && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={onDelete}
              title="Eliminar diagrama"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {activeTab === 'preview' ? (
        <div className={styles.previewArea}>
          {renderError ? (
            <div className={styles.errorBox}>{renderError}</div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: svgContent }} />
          )}
        </div>
      ) : (
        <textarea
          className={styles.codeArea}
          value={umlCode}
          onChange={handleCodeChange}
          placeholder="Escribí tu diagrama Mermaid acá..."
        />
      )}
    </div>
  );
};
