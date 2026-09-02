import { create } from 'zustand';
import { storageService } from '../services/storageService.js';

const defaultSettings = {
  theme: 'dark',
  fontFamily: 'Inter, sans-serif',
  fontSize: 16,
  autoSave: true,
  expandSubjects: false,
  showWelcome: true,
  storageMode: 'local',
  autoSync: true
};

const loaded = storageService.loadSettings();
if (loaded) {
  if (loaded.theme === 'github') loaded.theme = 'dark';
  if (loaded.theme === 'pastel') loaded.theme = 'peluche';
}
const initialSettings = { ...defaultSettings, ...loaded };

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialSettings.theme || 'dark');
  if (initialSettings.fontSize) {
    document.documentElement.style.setProperty('--font-size', `${initialSettings.fontSize}px`);
  }
  if (initialSettings.fontFamily) {
    document.documentElement.style.setProperty('--font-sans', initialSettings.fontFamily);
  }
}

export const useSettingsStore = create((set, get) => ({
  ...initialSettings,

  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state, ...newSettings };
      storageService.saveSettings(updated);

      if (newSettings.theme) {
        document.documentElement.setAttribute('data-theme', newSettings.theme);
      }
      if (newSettings.fontSize) {
        document.documentElement.style.setProperty('--font-size', `${newSettings.fontSize}px`);
      }
      if (newSettings.fontFamily) {
        document.documentElement.style.setProperty('--font-sans', newSettings.fontFamily);
      }

      return updated;
    });
  },

  setTheme: (theme) => {
    get().updateSettings({ theme });
  },

  setFontSize: (fontSize) => {
    get().updateSettings({ fontSize });
  },

  setFontFamily: (fontFamily) => {
    get().updateSettings({ fontFamily });
  },

  resetSettings: () => {
    set(defaultSettings);
    storageService.saveSettings(defaultSettings);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', defaultSettings.theme);
      document.documentElement.style.setProperty('--font-size', `${defaultSettings.fontSize}px`);
      document.documentElement.style.setProperty('--font-sans', defaultSettings.fontFamily);
    }
  }
}));
