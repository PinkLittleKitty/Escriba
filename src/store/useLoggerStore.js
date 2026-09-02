import { create } from 'zustand';
import { generateId } from '../utils/helpers.js';

export const useLoggerStore = create((set, get) => ({
  logs: [],
  maxLogs: 1000,
  filter: 'all',
  searchTerm: '',
  autoScroll: true,
  commandHistory: [],

  addLog: ({ level, message, timestamp }) => {
    set((state) => {
      const logs = [...state.logs];
      const last = logs[logs.length - 1];

      if (last && last.level === level && last.message === message) {
        last.count = (last.count || 1) + 1;
        last.timestamp = timestamp;
        return { logs: [...logs] };
      }

      const newEntry = {
        id: generateId('log'),
        level,
        message,
        timestamp,
        count: 1
      };

      if (logs.length >= state.maxLogs) {
        logs.shift();
      }

      logs.push(newEntry);
      return { logs };
    });
  },

  setFilter: (filter) => set({ filter }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),

  clear: () => set({ logs: [] }),

  addCommandHistory: (cmd) => {
    if (!cmd || !cmd.trim()) return;
    set((state) => ({
      commandHistory: [...state.commandHistory.filter((c) => c !== cmd), cmd]
    }));
  },

  getFormattedLogText: () => {
    const logs = get().logs;
    return logs
      .map((l) => {
        const countStr = l.count > 1 ? ` (×${l.count})` : '';
        return `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}${countStr}`;
      })
      .join('\n');
  }
}));
