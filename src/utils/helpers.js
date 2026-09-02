export const generateId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text.normalize('NFC');
};

export const cleanNoteContent = (content) => {
  if (!content || typeof content !== 'string') return content;
  let cleaned = content.normalize('NFC');
  return cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
};

export const escapeHtml = (text) => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay || diffDays === 0) {
    return 'Hoy';
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays <= 7) {
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const calculateReadingStats = (htmlContent = '') => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const text = (tempDiv.textContent || tempDiv.innerText || '').trim();

  if (!text) {
    return { words: 0, chars: 0, readingTime: 0 };
  }

  const words = text.split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const readingTime = Math.ceil(words / 200);

  return { words, chars, readingTime };
};

export const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
};
