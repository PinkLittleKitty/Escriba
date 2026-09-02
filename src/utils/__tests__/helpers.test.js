import { describe, it, expect } from 'vitest';
import {
  generateId,
  sanitizeText,
  cleanNoteContent,
  escapeHtml,
  formatDate,
  calculateReadingStats,
  parseLocalDate
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
});
