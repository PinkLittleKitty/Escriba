import React from 'react';
import { Check, Plus } from 'lucide-react';
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
  '#64748b',
];

export const ColorPicker = ({
  selectedColor = '#3b82f6',
  onChange,
  size = 'normal',
  includeCustom = true
}) => {
  return (
    <div className={styles.colorPicker}>
      {PRESET_COLORS.map((color) => {
        const isSelected = selectedColor?.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            className={`${styles.colorOption} ${size === 'small' ? styles.small : ''} ${isSelected ? styles.active : ''
              }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
          >
            {isSelected && <Check size={size === 'small' ? 12 : 16} className={styles.colorCheck} />}
          </button>
        );
      })}

      {includeCustom && (
        <label
          className={`${styles.customInputWrapper} ${size === 'small' ? styles.small : ''}`}
          title="Color personalizado"
          style={{ backgroundColor: !PRESET_COLORS.includes(selectedColor) ? selectedColor : 'transparent' }}
        >
          <input
            type="color"
            value={selectedColor || '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
          />
          {!PRESET_COLORS.includes(selectedColor) ? (
            <Check size={size === 'small' ? 12 : 16} className={styles.colorCheck} />
          ) : (
            <Plus size={14} color="var(--text-muted)" />
          )}
        </label>
      )}
    </div>
  );
};
