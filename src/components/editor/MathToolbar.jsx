import React, { useState } from 'react';
import { Search, X, PlusCircle, Sigma } from 'lucide-react';
import styles from './MathToolbar.module.css';

const GREEK_SYMBOLS = [
  { symbol: 'α', latex: '\\alpha', title: 'Alfa (α)' },
  { symbol: 'β', latex: '\\beta', title: 'Beta (β)' },
  { symbol: 'γ', latex: '\\gamma', title: 'Gamma (γ)' },
  { symbol: 'δ', latex: '\\delta', title: 'Delta (δ)' },
  { symbol: 'ε', latex: '\\varepsilon', title: 'Épsilon (ε)' },
  { symbol: 'θ', latex: '\\theta', title: 'Theta (θ)' },
  { symbol: 'λ', latex: '\\lambda', title: 'Lambda (λ)' },
  { symbol: 'μ', latex: '\\mu', title: 'Mu (μ)' },
  { symbol: 'π', latex: '\\pi', title: 'Pi (π)' },
  { symbol: 'σ', latex: '\\sigma', title: 'Sigma (σ)' },
  { symbol: 'φ', latex: '\\varphi', title: 'Phi (φ)' },
  { symbol: 'ω', latex: '\\omega', title: 'Omega (ω)' },
  { symbol: 'Δ', latex: '\\Delta', title: 'Delta Mayúscula (Δ)' },
  { symbol: 'Ω', latex: '\\Omega', title: 'Omega Mayúscula (Ω)' },
  { symbol: '∞', latex: '\\infty', title: 'Infinito (∞)' },
  { symbol: '∅', latex: '\\emptyset', title: 'Conjunto Vacío (∅)' }
];

const OPERATORS_SYMBOLS = [
  { symbol: '±', latex: '\\pm', title: 'Más / Menos (±)' },
  { symbol: '×', latex: '\\times', title: 'Multiplicación (×)' },
  { symbol: '÷', latex: '\\div', title: 'División (÷)' },
  { symbol: '·', latex: '\\cdot', title: 'Producto Punto (·)' },
  { symbol: '≠', latex: '\\neq', title: 'No igual (≠)' },
  { symbol: '≈', latex: '\\approx', title: 'Aproximadamente (≈)' },
  { symbol: '≤', latex: '\\le', title: 'Menor o igual (≤)' },
  { symbol: '≥', latex: '\\ge', title: 'Mayor o igual (≥)' },
  { symbol: '∈', latex: '\\in', title: 'Pertenece a (∈)' },
  { symbol: '∉', latex: '\\notin', title: 'No pertenece a (∉)' },
  { symbol: '⊂', latex: '\\subset', title: 'Subconjunto propio (⊂)' },
  { symbol: '⊆', latex: '\\subseteq', title: 'Subconjunto o igual (⊆)' },
  { symbol: '∪', latex: '\\cup', title: 'Unión (∪)' },
  { symbol: '∩', latex: '\\cap', title: 'Intersección (∩)' },
  { symbol: '∀', latex: '\\forall', title: 'Para todo (∀)' },
  { symbol: '∃', latex: '\\exists', title: 'Existe (∃)' },
  { symbol: '⇒', latex: '\\Rightarrow', title: 'Implica (⇒)' },
  { symbol: '⇔', latex: '\\Leftrightarrow', title: 'Si y solo si (⇔)' }
];

const CALCULUS_SYMBOLS = [
  { symbol: '∫', latex: '\\int', title: 'Integral simple (∫)' },
  { symbol: '∬', latex: '\\iint', title: 'Integral doble (∬)' },
  { symbol: '∭', latex: '\\iiint', title: 'Integral triple (∭)' },
  { symbol: '∮', latex: '\\oint', title: 'Integral de contorno (∮)' },
  { symbol: '∑', latex: '\\sum', title: 'Sumatoria (∑)' },
  { symbol: '∏', latex: '\\prod', title: 'Productoria (∏)' },
  { symbol: '√', latex: '\\sqrt{x}', title: 'Raíz cuadrada (√)' },
  { symbol: '∛', latex: '\\sqrt[3]{x}', title: 'Raíz cúbica (∛)' },
  { symbol: '∂', latex: '\\partial', title: 'Derivada parcial (∂)' },
  { symbol: '∇', latex: '\\nabla', title: 'Nabla / Gradiente (∇)' },
  { symbol: 'lim', latex: '\\lim_{x \\to 0}', title: 'Límite (lim)' },
  { symbol: 'dx', latex: '\\,dx', title: 'Diferencial (dx)' }
];

const STRUCTURE_TEMPLATES = [
  { label: 'Fracción', preview: 'a/b', latex: '\\frac{a}{b}', title: 'Fracción (a/b)' },
  { label: 'Potencia', preview: 'xⁿ', latex: 'x^{n}', title: 'Potencia / Superíndice' },
  { label: 'Subíndice', preview: 'xₙ', latex: 'x_{n}', title: 'Subíndice' },
  { label: 'Raíz n', preview: 'ⁿ√x', latex: '\\sqrt[n]{x}', title: 'Raíz n-ésima' },
  { label: 'Sumatoria', preview: '∑ᵢ xᵢ', latex: '\\sum_{i=1}^{n} x_i', title: 'Sumatoria con límites' },
  { label: 'Integral Def.', preview: '∫ₐᵇ f(x)', latex: '\\int_{a}^{b} f(x)\\,dx', title: 'Integral definida' },
  { label: 'Límite', preview: 'lim x→0', latex: '\\lim_{x \\to 0} f(x)', title: 'Límite' },
  {
    label: 'Matriz 2x2',
    preview: '[2×2]',
    latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
    title: 'Matriz 2x2'
  },
  {
    label: 'Sistema',
    preview: '{casos}',
    latex: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}',
    title: 'Sistema de Ecuaciones'
  }
];

export const MathToolbar = ({ onInsertSymbol, onInsertStructure, onInsertMathBlock }) => {
  const [activeCategory, setActiveCategory] = useState('greek');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSymbolClick = (item) => {
    if (onInsertSymbol) {
      onInsertSymbol(item);
    }
  };

  const handleStructureClick = (item) => {
    if (onInsertStructure) {
      onInsertStructure(item);
    }
  };

  const allSymbols = [...GREEK_SYMBOLS, ...OPERATORS_SYMBOLS, ...CALCULUS_SYMBOLS];
  const filteredSearchSymbols = searchQuery.trim()
    ? allSymbols.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.latex.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : null;

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.topRow}>
        <div className={styles.categoryTabs}>
          <button
            type="button"
            className={`${styles.catBtn} ${activeCategory === 'greek' && !searchQuery ? styles.active : ''}`}
            onClick={() => {
              setActiveCategory('greek');
              setSearchQuery('');
            }}
          >
            Griegos & Constantes
          </button>
          <button
            type="button"
            className={`${styles.catBtn} ${activeCategory === 'operators' && !searchQuery ? styles.active : ''}`}
            onClick={() => {
              setActiveCategory('operators');
              setSearchQuery('');
            }}
          >
            Operadores & Lógica
          </button>
          <button
            type="button"
            className={`${styles.catBtn} ${activeCategory === 'calculus' && !searchQuery ? styles.active : ''}`}
            onClick={() => {
              setActiveCategory('calculus');
              setSearchQuery('');
            }}
          >
            Cálculo & Funciones
          </button>
          <button
            type="button"
            className={`${styles.catBtn} ${activeCategory === 'structures' && !searchQuery ? styles.active : ''}`}
            onClick={() => {
              setActiveCategory('structures');
              setSearchQuery('');
            }}
          >
            Plantillas LaTeX
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={12} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar símbolo (ej: alfa, sum)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer', padding: 0 }}
              onClick={() => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {onInsertMathBlock && (
          <div className={styles.insertBlockAction}>
            <button
              type="button"
              className={styles.insertBlockBtn}
              onClick={onInsertMathBlock}
              title="Insertar bloque interactivo de fórmulas LaTeX con KaTeX"
            >
              <Sigma size={14} />
              <span>Insertar Bloque KaTeX</span>
            </button>
          </div>
        )}
      </div>

      <div className={styles.symbolsGrid}>
        {filteredSearchSymbols ? (
          filteredSearchSymbols.length === 0 ? (
            <span style={{ fontSize: '0.75rem', color: '#888888', padding: '6px' }}>
              No se encontraron símbolos para "{searchQuery}".
            </span>
          ) : (
            filteredSearchSymbols.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.symbolBtn}
                title={`${item.title} (${item.latex})`}
                onClick={() => handleSymbolClick(item)}
              >
                {item.symbol}
              </button>
            ))
          )
        ) : activeCategory === 'greek' ? (
          GREEK_SYMBOLS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.symbolBtn}
              title={`${item.title} (${item.latex})`}
              onClick={() => handleSymbolClick(item)}
            >
              {item.symbol}
            </button>
          ))
        ) : activeCategory === 'operators' ? (
          OPERATORS_SYMBOLS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.symbolBtn}
              title={`${item.title} (${item.latex})`}
              onClick={() => handleSymbolClick(item)}
            >
              {item.symbol}
            </button>
          ))
        ) : activeCategory === 'calculus' ? (
          CALCULUS_SYMBOLS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.symbolBtn}
              title={`${item.title} (${item.latex})`}
              onClick={() => handleSymbolClick(item)}
            >
              {item.symbol}
            </button>
          ))
        ) : (
          STRUCTURE_TEMPLATES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.structureBtn}
              title={item.title}
              onClick={() => handleStructureClick(item)}
            >
              <span className={styles.structurePreview}>{item.preview}</span>
              <span>{item.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
