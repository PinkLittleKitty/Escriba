import React, { useEffect, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Sigma, Eye, Code, BookOpen, Trash2, Copy, Check } from 'lucide-react';
import styles from './MathBlock.module.css';

const MATH_PRESETS = [
  {
    title: 'Fórmula Cuadrática',
    code: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
  },
  {
    title: 'Identidad de Euler',
    code: 'e^{i\\pi} + 1 = 0'
  },
  {
    title: 'Integral Gaussiana',
    code: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}'
  },
  {
    title: 'Transformada de Fourier',
    code: '\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\,e^{-2\\pi i x \\xi}\\,dx'
  },
  {
    title: 'Derivada por Definición',
    code: `f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}`
  },
  {
    title: 'Matriz de Rotación 2D',
    code: 'R(\\theta) = \\begin{pmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{pmatrix}'
  },
  {
    title: 'Distribución Normal',
    code: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}'
  },
  {
    title: 'Sistema de Ecuaciones',
    code: '\\begin{cases} a_1 x + b_1 y = c_1 \\\\ a_2 x + b_2 y = c_2 \\end{cases}'
  }
];

const QUICK_LATEX_ITEMS = [
  { label: 'α', latex: '\\alpha ' },
  { label: 'β', latex: '\\beta ' },
  { label: 'θ', latex: '\\theta ' },
  { label: 'λ', latex: '\\lambda ' },
  { label: 'π', latex: '\\pi ' },
  { label: 'σ', latex: '\\sigma ' },
  { label: 'ω', latex: '\\omega ' },
  { label: '∞', latex: '\\infty ' },
  { label: '±', latex: '\\pm ' },
  { label: '×', latex: '\\times ' },
  { label: '·', latex: '\\cdot ' },
  { label: '≠', latex: '\\neq ' },
  { label: '≤', latex: '\\le ' },
  { label: '≥', latex: '\\ge ' },
  { label: '∈', latex: '\\in ' },
  { label: '∫', latex: '\\int ' },
  { label: '∑', latex: '\\sum ' },
  { label: '√', latex: '\\sqrt{}', offset: 6 },
  { label: '∂', latex: '\\partial ' },
  { label: 'a/b', latex: '\\frac{}{}', offset: 6, isStructure: true },
  { label: 'xⁿ', latex: '^{}', offset: 2, isStructure: true },
  { label: 'xₙ', latex: '_{}', offset: 2, isStructure: true },
  { label: 'lim', latex: '\\lim_{x \\to 0} ', isStructure: true },
  { label: '[2×2]', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', isStructure: true }
];

export const MathBlock = ({
  formula = 'f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi',
  onChange,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [latex, setLatex] = useState(formula);
  const [htmlContent, setHtmlContent] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = React.useRef(null);
  const blockId = React.useRef('mb_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    try {
      const rendered = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true
      });
      setHtmlContent(rendered);
    } catch (e) {
      setHtmlContent(`<span style="color: var(--accent-red, #ef4444)">Error KaTeX: ${e.message}</span>`);
    }
  }, [latex]);

  const handleLatexChange = (val) => {
    setLatex(val);
    if (onChange) onChange(val);
  };

  const insertLatexAtCursor = (snippet, cursorOffset = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      handleLatexChange(latex + ' ' + snippet);
      return;
    }

    const start = textarea.selectionStart ?? latex.length;
    const end = textarea.selectionEnd ?? latex.length;
    const before = latex.substring(0, start);
    const after = latex.substring(end);
    const newText = before + snippet + after;

    handleLatexChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + (cursorOffset || snippet.length);
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  useEffect(() => {
    if (activeTab === 'code') {
      const handleGlobalInsert = (e) => {
        if (window.__lastActiveMathBlockId === blockId.current && e.detail) {
          const snippet = e.detail.latex || e.detail.symbol;
          if (snippet) {
            insertLatexAtCursor(snippet);
          }
        }
      };
      window.addEventListener('escriba-insert-math-symbol', handleGlobalInsert);
      return () => {
        window.removeEventListener('escriba-insert-math-symbol', handleGlobalInsert);
      };
    }
  }, [activeTab, latex]);

  const handleCopy = () => {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPreset = (presetCode) => {
    handleLatexChange(presetCode);
    setActiveTab('preview');
  };

  return (
    <div className="math-block-container" contentEditable={false} data-math-code={latex}>
      <div className={styles.screenWrapper}>
        <div className={styles.mathContainer}>
          <div className={styles.mathHeader}>
            <div className={styles.headerLeft}>
              <Sigma size={15} color="var(--accent-cyan, #06b6d4)" />
              <span>Fórmula Matemática (LaTeX)</span>
            </div>

            <div className={styles.tabGroup}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.active : ''}`}
                onClick={() => setActiveTab('preview')}
                title="Vista previa renderizada"
              >
                <Eye size={12} />
                <span>Fórmula</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'code' ? styles.active : ''}`}
                onClick={() => {
                  setActiveTab('code');
                  window.__lastActiveMathBlockId = blockId.current;
                }}
                title="Editar código LaTeX"
              >
                <Code size={12} />
                <span>LaTeX</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'presets' ? styles.active : ''}`}
                onClick={() => setActiveTab('presets')}
                title="Plantillas matemáticas comunes"
              >
                <BookOpen size={12} />
                <span>Plantillas</span>
              </button>
            </div>

            <div className={styles.headerRight}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleCopy}
                title="Copiar código LaTeX"
              >
                {copied ? <Check size={13} color="var(--accent-green, #10b981)" /> : <Copy size={13} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
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

          {activeTab === 'preview' && (
            <div className={styles.previewArea}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          )}

          {activeTab === 'code' && (
            <div className={styles.editorArea}>
              <div className={styles.quickSymbolsBar}>
                {QUICK_LATEX_ITEMS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={item.isStructure ? styles.quickStructureChip : styles.quickSymbolChip}
                    title={item.latex}
                    onClick={() => insertLatexAtCursor(item.latex, item.offset)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className={styles.codeArea}
                value={latex}
                onChange={(e) => handleLatexChange(e.target.value)}
                onFocus={() => {
                  window.__lastActiveMathBlockId = blockId.current;
                }}
                placeholder="Escribí tu fórmula en LaTeX..."
                rows={4}
              />
            </div>
          )}

          {activeTab === 'presets' && (
            <div className={styles.presetsGrid}>
              {MATH_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.presetCard}
                  onClick={() => handleSelectPreset(p.code)}
                >
                  <span className={styles.presetTitle}>{p.title}</span>
                  <span className={styles.presetPreview}>{p.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.printWrapper}>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </div>
  );
};
