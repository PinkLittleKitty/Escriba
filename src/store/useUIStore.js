import { create } from 'zustand';
import { generateId } from '../utils/helpers.js';

export const useUIStore = create((set, get) => ({
  activeModal: null,
  modalData: null,
  sidebarOpen: false,
  sidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true',
  sidebarView: localStorage.getItem('sidebar_view') || 'subjects',
  searchQuery: '',
  searchHighlightTarget: null,
  toasts: [],
  settingsTab: 'general',
  isConsoleOpen: false,
  editorZoom: (() => {
    const saved = localStorage.getItem('editor_zoom');
    const parsed = saved ? parseInt(saved, 10) : 100;
    return !isNaN(parsed) && parsed >= 50 && parsed <= 200 ? parsed : 100;
  })(),

  setEditorZoom: (zoom) => {
    set((state) => {
      const val = typeof zoom === 'function' ? zoom(state.editorZoom) : zoom;
      const clamped = Math.min(200, Math.max(50, Math.round(val)));
      localStorage.setItem('editor_zoom', String(clamped));
      return { editorZoom: clamped };
    });
  },

  resetEditorZoom: () => {
    localStorage.setItem('editor_zoom', '100');
    set({ editorZoom: 100 });
  },

  toggleConsole: () => set((state) => ({ isConsoleOpen: !state.isConsoleOpen })),
  openConsole: () => set({ isConsoleOpen: true }),
  closeConsole: () => set({ isConsoleOpen: false }),

  setSidebarView: (view) => {
    localStorage.setItem('sidebar_view', view);
    set({ sidebarView: view });
  },

  openModal: (modalName, data = null) => {
    set({ activeModal: modalName, modalData: data });
  },

  closeModal: () => {
    set({ activeModal: null, modalData: null });
  },

  setSettingsTab: (tab) => set({ settingsTab: tab }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebarCollapse: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem('sidebar_collapsed', String(next));
      return { sidebarCollapsed: next };
    }),
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
    set({ sidebarCollapsed: collapsed });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchHighlightTarget: (target) => set({ searchHighlightTarget: target }),

  addToast: ({ message, type = 'info', duration = 3500 }) => {
    const id = generateId('toast');
    const toast = { id, message, type };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));
