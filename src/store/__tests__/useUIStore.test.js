import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../useUIStore.js';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeModal: null,
      modalData: null,
      sidebarOpen: false,
      sidebarCollapsed: false,
      sidebarView: 'subjects',
      searchQuery: '',
      toasts: [],
      isConsoleOpen: false
    });
  });

  describe('Modal management', () => {
    it('opens and closes modals with payload', () => {
      useUIStore.getState().openModal('subject', { editId: 'sub-123' });
      let state = useUIStore.getState();
      expect(state.activeModal).toBe('subject');
      expect(state.modalData).toEqual({ editId: 'sub-123' });

      useUIStore.getState().closeModal();
      state = useUIStore.getState();
      expect(state.activeModal).toBe(null);
      expect(state.modalData).toBe(null);
    });
  });

  describe('Sidebar state', () => {
    it('toggles mobile sidebar drawer open state', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);

      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it('toggles desktop sidebar collapse state', () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      useUIStore.getState().toggleSidebarCollapse();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      useUIStore.getState().setSidebarCollapsed(false);
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('updates sidebar view filter (subjects, recent, favorites)', () => {
      useUIStore.getState().setSidebarView('recent');
      expect(useUIStore.getState().sidebarView).toBe('recent');

      useUIStore.getState().setSidebarView('favorites');
      expect(useUIStore.getState().sidebarView).toBe('favorites');
    });
  });

  describe('Toast notifications', () => {
    it('adds and removes toast messages', () => {
      const toastId = useUIStore.getState().addToast({
        message: 'Nota guardada con éxito',
        type: 'success',
        duration: 0
      });

      let toasts = useUIStore.getState().toasts;
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Nota guardada con éxito');
      expect(toasts[0].type).toBe('success');

      useUIStore.getState().removeToast(toastId);
      toasts = useUIStore.getState().toasts;
      expect(toasts.length).toBe(0);
    });
  });

  describe('Search and Dev Console', () => {
    it('updates search query', () => {
      useUIStore.getState().setSearchQuery('Parcial 1');
      expect(useUIStore.getState().searchQuery).toBe('Parcial 1');
    });

    it('toggles dev console state', () => {
      expect(useUIStore.getState().isConsoleOpen).toBe(false);
      useUIStore.getState().toggleConsole();
      expect(useUIStore.getState().isConsoleOpen).toBe(true);
      useUIStore.getState().closeConsole();
      expect(useUIStore.getState().isConsoleOpen).toBe(false);
    });
  });
});
