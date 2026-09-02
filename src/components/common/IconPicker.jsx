import React, { useState, useMemo } from 'react';
import { Search, X, Type } from 'lucide-react';
import {
  SUBJECT_ICON_CATEGORIES,
  SUBJECT_ICON_MAP,
  getAllSubjectIcons
} from '../../utils/subjectIcons.js';
import styles from './IconPicker.module.css';

export const IconPicker = ({
  selectedIcon,
  onChange,
  color,
  allowClear = true,
  fallbackText = 'Aa'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const allIcons = useMemo(() => getAllSubjectIcons(), []);

  const filteredIcons = useMemo(() => {
    let list = allIcons;

    if (activeCategory !== 'all') {
      list = list.filter((item) => item.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [allIcons, activeCategory, searchQuery]);

  return (
    <div className={styles.container} data-testid="icon-picker">
      <div className={styles.searchRow}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar icono (ej: código, libro, cálculo, átomo)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className={styles.clearSearchBtn}
            onClick={() => setSearchQuery('')}
            title="Limpiar búsqueda"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className={styles.categoriesBar}>
        {SUBJECT_ICON_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.categoryPill} ${activeCategory === cat.id ? styles.activeCategory : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className={styles.iconGridWrapper}>
        {filteredIcons.length === 0 ? (
          <div className={styles.noResults}>
            No se encontraron iconos para "{searchQuery}"
          </div>
        ) : (
          <div className={styles.iconGrid}>
            {filteredIcons.map((item) => {
              const IconComp = SUBJECT_ICON_MAP[item.id];
              if (!IconComp) return null;
              const isSelected = selectedIcon === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.iconBtn} ${isSelected ? styles.selected : ''}`}
                  style={isSelected && color ? { borderColor: color, color } : undefined}
                  onClick={() => onChange(item.id)}
                  title={`${item.label} (${item.categoryName})`}
                  aria-label={item.label}
                  data-testid={`icon-option-${item.id}`}
                >
                  <IconComp size={18} strokeWidth={2} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.footerActions}>
        {allowClear && (
          <button
            type="button"
            className={`${styles.clearIconBtn} ${!selectedIcon ? styles.activeTextMode : ''}`}
            onClick={() => onChange(null)}
            title="Usar la sigla o iniciales del texto"
            data-testid="icon-use-text-btn"
          >
            <Type size={13} />
            <span>Usar texto ({fallbackText})</span>
          </button>
        )}

        <span className={styles.iconCount}>
          {filteredIcons.length} {filteredIcons.length === 1 ? 'icono' : 'iconos'}
        </span>
      </div>
    </div>
  );
};
