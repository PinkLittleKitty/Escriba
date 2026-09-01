import React, { useEffect, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Sigma, Eye, Code, Trash2 } from 'lucide-react';
import styles from './UMLBlock.module.css';

export const MathBlock = ({
  formula = 'f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi',
  onChange,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [latex, setLatex] = useState(formula);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    try {
      const rendered = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true
      });
      setHtmlContent(rendered);
    } catch (e) {
      setHtmlContent(`<span style="color: var(--accent-red)">Error: ${e.message}</span>`);
    }
  }, [latex]);

  const handleLatexChange = (e) => {
    const val = e.target.value;
    setLatex(val);
    if (onChange) onChange(val);
  };

  return (
    <div className={styles.umlContainer} contentEditable={false}>
      <div className={styles.umlHeader}>
        <div className={styles.headerLeft}>
          <Sigma size={14} color="var(--accent-cyan)" />
          <span>Fórmula Matemática (LaTeX)</span>
        </div>

        <div className={styles.tabGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.active : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Eye size={12} />
            <span>Fórmula</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'code' ? styles.active : ''}`}
            onClick={() => setActiveTab('code')}
          >
            <Code size={12} />
            <span>LaTeX</span>
          </button>
        </div>

        <div className={styles.headerRight}>
          {onDelete && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={onDelete}
              title="Eliminar fórmula"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {activeTab === 'preview' ? (
        <div className={styles.previewArea} style={{ padding: '1.5rem 1rem' }}>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      ) : (
        <textarea
          className={styles.codeArea}
          value={latex}
          onChange={handleLatexChange}
          placeholder="Escribí tu fórmula en LaTeX..."
          rows={3}
        />
      )}
    </div>
  );
};
