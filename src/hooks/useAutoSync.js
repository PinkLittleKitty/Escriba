import { useEffect, useRef } from 'react';
import { useGitHubStore } from '../store/useGitHubStore.js';
import { useNotesStore } from '../store/useNotesStore.js';
import { useSettingsStore } from '../store/useSettingsStore.js';

export const useAutoSync = () => {
  const autoSyncDebounceTimer = useRef(null);
  const lastFocusSyncTime = useRef(0);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      const { isAuthenticated, sync, syncStatus } = useGitHubStore.getState();
      const { autoSync } = useSettingsStore.getState();
      if (isAuthenticated && autoSync !== false && syncStatus !== 'syncing') {
        sync();
      }
    }, 2000);

    const intervalTimer = setInterval(() => {
      const { isAuthenticated, sync, syncStatus } = useGitHubStore.getState();
      const { autoSync } = useSettingsStore.getState();
      if (isAuthenticated && autoSync !== false && syncStatus !== 'syncing') {
        sync();
      }
    }, 5 * 60 * 1000);

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusSyncTime.current < 60000) return;
      lastFocusSyncTime.current = now;

      const { isAuthenticated, sync, syncStatus } = useGitHubStore.getState();
      const { autoSync } = useSettingsStore.getState();
      if (isAuthenticated && autoSync !== false && syncStatus !== 'syncing') {
        sync();
      }
    };
    window.addEventListener('focus', handleFocus);

    const unsubscribeNotes = useNotesStore.subscribe((state, prevState) => {
      if (state.subjects === prevState.subjects) return;
      const { isAuthenticated, syncStatus, isApplyingRemote } = useGitHubStore.getState();
      const { autoSync } = useSettingsStore.getState();

      if (!isAuthenticated || autoSync === false || syncStatus === 'syncing' || isApplyingRemote) return;

      if (autoSyncDebounceTimer.current) {
        clearTimeout(autoSyncDebounceTimer.current);
      }

      autoSyncDebounceTimer.current = setTimeout(() => {
        const currentGh = useGitHubStore.getState();
        const currentSettings = useSettingsStore.getState();
        if (currentGh.isAuthenticated && currentSettings.autoSync !== false && currentGh.syncStatus !== 'syncing' && !currentGh.isApplyingRemote) {
          currentGh.sync();
        }
      }, 5000);
    });

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      if (autoSyncDebounceTimer.current) clearTimeout(autoSyncDebounceTimer.current);
      window.removeEventListener('focus', handleFocus);
      unsubscribeNotes();
    };
  }, []);
};
