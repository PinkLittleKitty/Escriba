import React from 'react';
import { getSubjectIconComponent, getSubjectInitials } from '../../utils/subjectIcons.js';
import styles from './SubjectBadge.module.css';

export const SubjectBadge = ({
  subject,
  size = 'md',
  isArchived = false,
  className = '',
  style = {},
  title
}) => {
  if (!subject) return null;

  const IconComponent = getSubjectIconComponent(subject.icon);
  const initials = getSubjectInitials(subject);

  const getIconPixelSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'md':
        return 14;
      case 'lg':
        return 18;
      case 'xl':
        return 22;
      default:
        return typeof size === 'number' ? Math.round(size * 0.55) : 14;
    }
  };

  const badgeSizeClass = typeof size === 'string' && styles[`size_${size}`]
    ? styles[`size_${size}`]
    : styles.size_md;

  const customDimensions = typeof size === 'number'
    ? { width: `${size}px`, height: `${size}px`, borderRadius: `${Math.round(size * 0.22)}px`, fontSize: `${Math.round(size * 0.35)}px` }
    : {};

  const backgroundColor = isArchived
    ? 'var(--text-muted)'
    : (subject.color || 'var(--accent-blue)');

  return (
    <div
      className={`${styles.badge} ${badgeSizeClass} ${isArchived ? styles.archived : ''} ${className}`}
      style={{
        backgroundColor,
        ...customDimensions,
        ...style
      }}
      title={title || subject.name}
      data-testid="subject-badge"
    >
      {IconComponent ? (
        <span className={styles.iconWrapper} data-testid="subject-badge-icon">
          <IconComponent size={getIconPixelSize()} strokeWidth={2.2} />
        </span>
      ) : (
        <span className={styles.initialsText} data-testid="subject-badge-text">
          {initials}
        </span>
      )}
    </div>
  );
};
