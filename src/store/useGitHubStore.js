import { create } from 'zustand';
import { gitHubService } from '../services/githubService.js';
import { useNotesStore } from './useNotesStore.js';
import { useSettingsStore } from './useSettingsStore.js';

export const useGitHubStore = create((set, get) => ({
  token: localStorage.getItem('github_access_token') || '',
  username: localStorage.getItem('github_username') || '',
  repoName: localStorage.getItem('github_repo_name') || 'escriba-notes',
  isAuthenticated: !!localStorage.getItem('github_access_token'),
  syncStatus: 'idle',
  lastSyncTime: localStorage.getItem('last_sync_time') || null,
  lastError: null,

  connectToken: async (token, repo = 'escriba-notes') => {
    if (!token) return { success: false, error: 'Token vacío' };

    set({ syncStatus: 'syncing', lastError: null });
    try {
      const userInfo = await gitHubService.getUserInfo(token);
      const username = userInfo.login;

      localStorage.setItem('github_access_token', token);
      localStorage.setItem('github_username', username);
      localStorage.setItem('github_repo_name', repo);

      set({
        token,
        username,
        repoName: repo,
        isAuthenticated: true,
        syncStatus: 'idle',
        lastError: null
      });

      setTimeout(() => {
        get().sync();
      }, 300);

      return { success: true, username };
    } catch (err) {
      set({ syncStatus: 'error', lastError: err.message });
      return { success: false, error: err.message };
    }
  },

  disconnect: () => {
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('github_username');
    localStorage.removeItem('last_sync_time');
    set({
      token: '',
      username: '',
      isAuthenticated: false,
      syncStatus: 'idle',
      lastSyncTime: null,
      lastError: null
    });
  },

  sync: async () => {
    const { token, username, repoName, isAuthenticated } = get();
    if (!isAuthenticated || !token) return { success: false, error: 'No autenticado' };

    set({ syncStatus: 'syncing', lastError: null });

    try {
      const rawDeleted = useNotesStore.getState().deletedItems;
      const formattedDeleted = Array.isArray(rawDeleted)
        ? {
          notes: rawDeleted.filter((d) => d.type === 'note').map((d) => d.item?.id || d.id).filter(Boolean),
          subjects: rawDeleted.filter((d) => d.type === 'subject').map((d) => d.item?.id || d.id).filter(Boolean)
        }
        : (rawDeleted || { notes: [], subjects: [] });

      const localData = {
        subjects: useNotesStore.getState().subjects,
        events: useNotesStore.getState().events,
        settings: useSettingsStore.getState(),
        deletedItems: formattedDeleted
      };

      const mergedData = await gitHubService.sync(token, username, repoName, localData);

      if (mergedData && Array.isArray(mergedData.subjects)) {
        useNotesStore.getState().setAllData({
          subjects: mergedData.subjects,
          events: mergedData.events || [],
          deletedItems: Array.isArray(rawDeleted) ? rawDeleted : []
        });
        if (mergedData.settings) {
          useSettingsStore.getState().updateSettings(mergedData.settings);
        }
      }

      const syncTime = new Date().toISOString();
      localStorage.setItem('last_sync_time', syncTime);

      set({
        syncStatus: 'success',
        lastSyncTime: syncTime,
        lastError: null
      });

      setTimeout(() => {
        if (get().syncStatus === 'success') {
          set({ syncStatus: 'idle' });
        }
      }, 3000);

      return { success: true, data: mergedData };
    } catch (err) {
      console.error('GitHub Sync error:', err);
      set({ syncStatus: 'error', lastError: err.message });
      return { success: false, error: err.message };
    }
  },

  forcePush: async () => {
    const { token, username, repoName, isAuthenticated } = get();
    if (!isAuthenticated || !token) return { success: false, error: 'No autenticado' };

    set({ syncStatus: 'syncing', lastError: null });
    try {
      const rawDeleted = useNotesStore.getState().deletedItems;
      const formattedDeleted = Array.isArray(rawDeleted)
        ? {
          notes: rawDeleted.filter((d) => d.type === 'note').map((d) => d.item?.id || d.id).filter(Boolean),
          subjects: rawDeleted.filter((d) => d.type === 'subject').map((d) => d.item?.id || d.id).filter(Boolean)
        }
        : (rawDeleted || { notes: [], subjects: [] });

      const localData = {
        subjects: useNotesStore.getState().subjects,
        events: useNotesStore.getState().events,
        settings: useSettingsStore.getState(),
        deletedItems: formattedDeleted
      };

      await gitHubService.uploadData(token, username, repoName, localData);
      const syncTime = new Date().toISOString();
      localStorage.setItem('last_sync_time', syncTime);

      set({ syncStatus: 'success', lastSyncTime: syncTime, lastError: null });
      setTimeout(() => {
        if (get().syncStatus === 'success') set({ syncStatus: 'idle' });
      }, 3000);

      return { success: true };
    } catch (err) {
      console.error('GitHub force push error:', err);
      set({ syncStatus: 'error', lastError: err.message });
      return { success: false, error: err.message };
    }
  },

  forcePull: async () => {
    const { token, username, repoName, isAuthenticated } = get();
    if (!isAuthenticated || !token) return { success: false, error: 'No autenticado' };

    set({ syncStatus: 'syncing', lastError: null });
    try {
      const remoteData = await gitHubService.getRemoteData(token, username, repoName);
      if (remoteData && Array.isArray(remoteData.subjects)) {
        useNotesStore.getState().setAllData({
          subjects: remoteData.subjects,
          events: remoteData.events || [],
          deletedItems: []
        });
        if (remoteData.settings) {
          useSettingsStore.getState().updateSettings(remoteData.settings);
        }
      }

      const syncTime = new Date().toISOString();
      localStorage.setItem('last_sync_time', syncTime);

      set({ syncStatus: 'success', lastSyncTime: syncTime, lastError: null });
      setTimeout(() => {
        if (get().syncStatus === 'success') set({ syncStatus: 'idle' });
      }, 3000);

      return { success: true, data: remoteData };
    } catch (err) {
      console.error('GitHub force pull error:', err);
      set({ syncStatus: 'error', lastError: err.message });
      return { success: false, error: err.message };
    }
  },

  uploadSingleNote: async (note, subjectId) => {
    const { token, username, repoName, isAuthenticated } = get();
    if (!isAuthenticated || !token || !note) return false;
    try {
      await gitHubService.uploadSingleNote(token, username, repoName, note, subjectId);
      return true;
    } catch (err) {
      console.error('Error uploading single note to GitHub:', err);
      return false;
    }
  }
}));
