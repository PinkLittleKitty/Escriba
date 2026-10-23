import { useState, useEffect } from 'react';

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.listeners = new Set();
    this.isInstalled = false;
    this.registration = null;

    if (typeof window !== 'undefined') {
      this.checkInstalled();
      this.init();
    }
  }

  checkInstalled() {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    this.isInstalled = isStandalone;
    return isStandalone;
  }

  init() {
    const isElectron = !!(window.electronAPI || window.process?.versions?.electron);
    const isCapacitor = !!window.Capacitor;

    if (isElectron || isCapacitor) {
      return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notify();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.notify();
    });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js')
          .then((reg) => {
            this.registration = reg;
            this.notify();
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }

  canInstall() {
    return !this.isInstalled && this.deferredPrompt !== null;
  }

  async installApp() {
    if (!this.deferredPrompt) {
      return { success: false, error: 'No install prompt available' };
    }

    try {
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notify();
      return { success: choice.outcome === 'accepted' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = {
      canInstall: this.canInstall(),
      isInstalled: this.isInstalled,
      hasServiceWorker: !!this.registration
    };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('[PWA] Error in listener:', e);
      }
    });
  }

  getState() {
    return {
      canInstall: this.canInstall(),
      isInstalled: this.isInstalled,
      hasServiceWorker: !!this.registration
    };
  }
}

export const pwaService = new PWAService();

export const usePWA = () => {
  const [state, setState] = useState(() => pwaService.getState());

  useEffect(() => {
    return pwaService.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  return {
    ...state,
    installApp: () => pwaService.installApp()
  };
};
