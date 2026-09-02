import { describe, it, expect } from 'vitest';
import {
  generateId,
  sanitizeText,
  cleanNoteContent,
  escapeHtml,
  formatDate,
  calculateReadingStats,
  parseLocalDate,
  getSearchSnippet,
  highlightAndScrollToMatch,
  normalizeScheduleDay,
  normalizeTime,
  normalizeScheduleItem
} from '../helpers.js';

describe('helpers utility functions', () => {
  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).toMatch(/^id-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^id-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('generates unique IDs with custom prefix', () => {
      const id = generateId('note');
      expect(id.startsWith('note-')).toBe(true);
    });
  });

  describe('sanitizeText & cleanNoteContent', () => {
    it('normalizes string to NFC form', () => {
      const decomposed = 'e\u0301';
      const normalized = sanitizeText(decomposed);
      expect(normalized).toBe('é');
    });

    it('handles non-string values', () => {
      expect(sanitizeText(null)).toBe(null);
      expect(sanitizeText(undefined)).toBe(undefined);
      expect(sanitizeText(123)).toBe(123);
    });

    it('strips control characters', () => {
      const dirty = 'Hello\u0000World\u0007!';
      expect(cleanNoteContent(dirty)).toBe('HelloWorld!');
    });
  });

  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      const dangerous = '<script>alert("XSS" & \'test\')</script>';
      const safe = escapeHtml(dangerous);
      expect(safe).toBe('&lt;script&gt;alert(&quot;XSS&quot; &amp; &#039;test&#039;)&lt;/script&gt;');
    });

    it('returns empty string for null or undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('returns empty string for invalid date', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });

    it('returns Hoy for today date', () => {
      const today = new Date().toISOString();
      expect(formatDate(today)).toBe('Hoy');
    });
  });

  describe('calculateReadingStats', () => {
    it('calculates stats for empty or whitespace content', () => {
      expect(calculateReadingStats('')).toEqual({ words: 0, chars: 0, readingTime: 0 });
      expect(calculateReadingStats('   ')).toEqual({ words: 0, chars: 0, readingTime: 0 });
    });

    it('extracts text from HTML tags and counts words and chars', () => {
      const html = '<p>Este es un <strong>apunte</strong> de prueba.</p>';
      const stats = calculateReadingStats(html);
      expect(stats.words).toBe(6);
      expect(stats.chars).toBe(28);
      expect(stats.readingTime).toBe(1);
    });
  });

  describe('parseLocalDate', () => {
    it('parses YYYY-MM-DD string into Date object', () => {
      const date = parseLocalDate('2026-09-02');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(8);
      expect(date.getDate()).toBe(2);
    });

    it('handles ISO string format', () => {
      const date = parseLocalDate('2026-12-25T14:30:00');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(25);
    });

    it('returns null for invalid strings', () => {
      expect(parseLocalDate('')).toBe(null);
      expect(parseLocalDate('not-a-date')).toBe(null);
      expect(parseLocalDate(null)).toBe(null);
    });
  });

  describe('getSearchSnippet', () => {
    it('returns null if content or query is empty', () => {
      expect(getSearchSnippet('', 'query')).toBe(null);
      expect(getSearchSnippet('<p>Hola</p>', '')).toBe(null);
      expect(getSearchSnippet(null, 'query')).toBe(null);
    });

    it('returns null if query does not match', () => {
      expect(getSearchSnippet('<p>Hola mundo</p>', 'algoritmo')).toBe(null);
    });

    it('extracts snippet with matched text and context', () => {
      const content = '<p>En esta clase vimos el algoritmo de Dijkstra para caminos mínimos.</p>';
      const snippet = getSearchSnippet(content, 'Dijkstra');
      expect(snippet).not.toBe(null);
      expect(snippet.matchedText.toLowerCase()).toBe('dijkstra');
      expect(snippet.beforeMatch).toContain('algoritmo de');
      expect(snippet.afterMatch).toContain('caminos');
    });
  });

  describe('highlightAndScrollToMatch', () => {
    it('wraps match in mark.search-match-temp and cleans up', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      container.innerHTML = '<p>Introducción a grafos y árboles binarios en algoritmos.</p>';
      document.body.appendChild(container);

      window.HTMLElement.prototype.scrollIntoView = vi.fn();

      const res = highlightAndScrollToMatch(container, 'árboles', 1000);
      expect(res).toBe(true);

      const mark = container.querySelector('mark.search-match-temp');
      expect(mark).not.toBe(null);
      expect(mark.textContent).toBe('árboles');

      vi.advanceTimersByTime(1100);
      expect(container.querySelector('mark.search-match-temp')).toBe(null);
      expect(container.textContent).toContain('árboles');

      document.body.removeChild(container);
      vi.useRealTimers();
    });
  });

  describe('schedule and time normalization', () => {
    it('normalizes day names from various formats', () => {
      expect(normalizeScheduleDay('lunes')).toBe('Lunes');
      expect(normalizeScheduleDay('miercoles')).toBe('Miércoles');
      expect(normalizeScheduleDay('Miércoles')).toBe('Miércoles');
      expect(normalizeScheduleDay('sabado')).toBe('Sábado');
      expect(normalizeScheduleDay('domingo')).toBe('Domingo');
      expect(normalizeScheduleDay(1)).toBe('Lunes');
      expect(normalizeScheduleDay(0)).toBe('Domingo');
      expect(normalizeScheduleDay(null)).toBe('Lunes');
    });

    it('normalizes times to HH:mm 2-digit format', () => {
      expect(normalizeTime('9:00')).toBe('09:00');
      expect(normalizeTime('09:30')).toBe('09:30');
      expect(normalizeTime('18:00:00')).toBe('18:00');
      expect(normalizeTime('')).toBe('');
      expect(normalizeTime(null)).toBe('');
    });

    it('normalizes schedule item objects consistently', () => {
      const item = {
        day: 'miercoles',
        time: '9:00',
        endTime: '12:00',
        classroom: ' Aula 302 '
      };
      const normalized = normalizeScheduleItem(item);
      expect(normalized.day).toBe('Miércoles');
      expect(normalized.startTime).toBe('09:00');
      expect(normalized.endTime).toBe('12:00');
      expect(normalized.time).toBe('09:00');
      expect(normalized.classroom).toBe('Aula 302');
    });
  });
});
