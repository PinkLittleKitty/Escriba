import React from 'react';
import { Check, Plus, Ban } from 'lucide-react';
import styles from './ColorPicker.module.css';

export const PRESET_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#64748b'
];

export const HIGHLIGHT_PRESETS = [
  { label: 'Color del tema', value: 'var(--highlight-bg, #fef08a)' },
  { label: 'Amarillo', value: '#fef08a' },
  { label: 'Verde', value: '#bbf7d0' },
  { label: 'Celeste', value: '#bae6fd' },
  { label: 'Rosa', value: '#fbcfe8' },
  { label: 'Naranja', value: '#fed7aa' },
  { label: 'Violeta', value: '#e9d5ff' },
  { label: 'Rojo', value: '#fecaca' }
];

export const ColorPicker = ({
  presets = PRESET_COLORS,
  selectedColor = '#3b82f6',
  onChange,
  size = 'normal',
  includeCustom = true,
  allowClear = false,
  clearTitle = 'Sin color'
}) => {
  return (
    <div className={styles.colorPicker}>
      {presets.map((item) => {
        const color = typeof item === 'object' && item !== null ? item.value : item;
        const label =
          typeof item === 'object' && item !== null
            ? item.label
            : typeof color === 'string' && color.startsWith('var(')
            ? 'Color del tema'
            : color;
        const isSelected =
          selectedColor && color && selectedColor.toLowerCase() === color.toLowerCase();

        return (
          <button
            key={color}
            type="button"
            className={`${styles.colorOption} ${size === 'small' ? styles.small : ''} ${
              isSelected ? styles.active : ''
            }`}
            style={{ backgroundColor: color }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(color)}
            title={label}
          >
            {isSelected && (
              <Check size={size === 'small' ? 12 : 16} className={styles.colorCheck} />
            )}
          </button>
        );
      })}

      {allowClear && (
        <button
          type="button"
          className={`${styles.colorOption} ${styles.clearOption} ${
            size === 'small' ? styles.small : ''
          } ${selectedColor === 'transparent' ? styles.active : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange('transparent')}
          title={clearTitle}
        >
          <Ban size={size === 'small' ? 12 : 14} className={styles.clearIcon} />
        </button>
      )}

      {includeCustom && (
        <label
          className={`${styles.customInputWrapper} ${size === 'small' ? styles.small : ''}`}
          title="Color personalizado"
          style={{
            backgroundColor:
              selectedColor &&
              !presets.includes(selectedColor) &&
              selectedColor !== 'transparent'
                ? selectedColor
                : 'transparent'
          }}
        >
          <input
            type="color"
            value={
              selectedColor && selectedColor.startsWith('#')
                ? selectedColor
                : '#3b82f6'
            }
            onChange={(e) => onChange(e.target.value)}
          />
          {selectedColor &&
          !presets.includes(selectedColor) &&
          selectedColor !== 'transparent' ? (
            <Check size={size === 'small' ? 12 : 16} className={styles.colorCheck} />
          ) : (
            <Plus size={size === 'small' ? 12 : 14} color="var(--text-muted)" />
          )}
        </label>
      )}
    </div>
  );
};
