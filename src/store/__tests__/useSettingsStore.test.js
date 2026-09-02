import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../useSettingsStore.js';

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: 'dark',
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
      autoSave: true,
      expandSubjects: false,
      showWelcome: true,
      storageMode: 'local',
      autoSync: true
    });
  });

  it('updates theme and sets data-theme attribute on root', () => {
    useSettingsStore.getState().setTheme('nord');
    expect(useSettingsStore.getState().theme).toBe('nord');
    expect(document.documentElement.getAttribute('data-theme')).toBe('nord');

    useSettingsStore.getState().setTheme('sakura');
    expect(useSettingsStore.getState().theme).toBe('sakura');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sakura');

    useSettingsStore.getState().setTheme('peluche');
    expect(useSettingsStore.getState().theme).toBe('peluche');
    expect(document.documentElement.getAttribute('data-theme')).toBe('peluche');

    useSettingsStore.getState().setTheme('sunset');
    expect(useSettingsStore.getState().theme).toBe('sunset');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sunset');
  });

  it('updates font size and sets CSS variable', () => {
    useSettingsStore.getState().setFontSize(18);
    expect(useSettingsStore.getState().fontSize).toBe(18);
    expect(document.documentElement.style.getPropertyValue('--font-size')).toBe('18px');
  });

  it('updates multiple settings simultaneously', () => {
    useSettingsStore.getState().updateSettings({
      autoSave: false,
      expandSubjects: true,
      storageMode: 'github'
    });

    const state = useSettingsStore.getState();
    expect(state.autoSave).toBe(false);
    expect(state.expandSubjects).toBe(true);
    expect(state.storageMode).toBe('github');
  });
});
