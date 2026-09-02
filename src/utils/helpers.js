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

export const getSearchSnippet = (htmlContent = '', query = '', maxLength = 80) => {
  if (!htmlContent || !query || typeof query !== 'string') return null;

  let plainText = '';
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    plainText = (temp.textContent || temp.innerText || '').replace(/\s+/g, ' ').trim();
  } else {
    plainText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  if (!plainText) return null;

  const lowerText = plainText.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return null;

  const matchIndex = lowerText.indexOf(lowerQuery);
  if (matchIndex === -1) return null;

  const charsBefore = 25;
  const start = Math.max(0, matchIndex - charsBefore);
  const end = Math.min(plainText.length, matchIndex + lowerQuery.length + maxLength);

  const prefix = start > 0 ? '…' : '';
  const suffix = end < plainText.length ? '…' : '';

  const beforeMatch = plainText.substring(start, matchIndex);
  const matchedText = plainText.substring(matchIndex, matchIndex + lowerQuery.length);
  const afterMatch = plainText.substring(matchIndex + lowerQuery.length, end);

  return {
    prefix,
    beforeMatch,
    matchedText,
    afterMatch,
    suffix
  };
};

export const highlightAndScrollToMatch = (container, query, durationMs = 2500) => {
  if (!container || !query || typeof query !== 'string' || typeof document === 'undefined') {
    return false;
  }

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return false;

  const existingMarks = container.querySelectorAll('mark.search-match-temp');
  existingMarks.forEach((m) => {
    if (m.parentNode) {
      const text = document.createTextNode(m.textContent || '');
      const parent = m.parentNode;
      parent.replaceChild(text, m);
      parent.normalize();
    }
  });

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  let targetNode = null;
  let matchOffset = -1;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (
      node.parentElement &&
      node.parentElement.closest(
        '.inline-ace-editor, .math-block-container, .uml-block-container, .math-toolbar'
      )
    ) {
      continue;
    }

    const idx = (node.textContent || '').toLowerCase().indexOf(cleanQuery);
    if (idx !== -1) {
      targetNode = node;
      matchOffset = idx;
      break;
    }
  }

  if (!targetNode || !targetNode.parentNode) return false;

  const fullText = targetNode.textContent || '';
  const before = fullText.substring(0, matchOffset);
  const matched = fullText.substring(matchOffset, matchOffset + cleanQuery.length);
  const after = fullText.substring(matchOffset + cleanQuery.length);

  const mark = document.createElement('mark');
  mark.className = 'search-match-temp';
  mark.textContent = matched;

  const fragment = document.createDocumentFragment();
  if (before) fragment.appendChild(document.createTextNode(before));
  fragment.appendChild(mark);
  if (after) fragment.appendChild(document.createTextNode(after));

  const parent = targetNode.parentNode;
  parent.replaceChild(fragment, targetNode);

  try {
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) {
    mark.scrollIntoView();
  }

  setTimeout(() => {
    if (mark && mark.parentNode) {
      const restored = document.createTextNode(mark.textContent || '');
      const p = mark.parentNode;
      p.replaceChild(restored, mark);
      p.normalize();
    }
  }, durationMs);

  return true;
};

export const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
];

export const normalizeScheduleDay = (day) => {
  if (day === null || day === undefined) return 'Lunes';
  if (typeof day === 'number') {
    const dayMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dayMap[day % 7] || 'Lunes';
  }
  const str = String(day).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/^(dom|domingo|0|7)$/.test(str)) return 'Domingo';
  if (/^(lun|lunes|1)$/.test(str)) return 'Lunes';
  if (/^(mar|martes|2)$/.test(str)) return 'Martes';
  if (/^(mie|miercoles|3)$/.test(str)) return 'Miércoles';
  if (/^(jue|jueves|4)$/.test(str)) return 'Jueves';
  if (/^(vie|viernes|5)$/.test(str)) return 'Viernes';
  if (/^(sab|sabado|6)$/.test(str)) return 'Sábado';
  return 'Lunes';
};

export const normalizeTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const clean = timeStr.trim().toLowerCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return clean;
  const hours = match[1].padStart(2, '0');
  const mins = match[2];
  return `${hours}:${mins}`;
};

export const normalizeScheduleItem = (item = {}) => {
  if (!item || typeof item !== 'object') {
    return { day: 'Lunes', startTime: '09:00', endTime: '13:00', classroom: '' };
  }
  const startTime = normalizeTime(item.startTime || item.time || item.start || '');
  const endTime = normalizeTime(item.endTime || item.end || '');
  return {
    day: normalizeScheduleDay(item.day),
    startTime,
    endTime,
    time: startTime,
    classroom: String(item.classroom || item.room || '').trim()
  };
};

