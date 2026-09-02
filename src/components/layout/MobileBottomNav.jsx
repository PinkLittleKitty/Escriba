import React from 'react';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Folder,
  Settings
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import styles from './MobileBottomNav.module.css';

export const MobileBottomNav = () => {
  const activeView = useNotesStore((state) => state.activeView);
  const setActiveView = useNotesStore((state) => state.setActiveView);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const openModal = useUIStore((state) => state.openModal);
  const activeModal = useUIStore((state) => state.activeModal);

  const handleNavClick = (target) => {
    if (target === 'dashboard') {
      setActiveView('dashboard');
      setSidebarOpen(false);
    } else if (target === 'calendar') {
      setActiveView('calendar');
      setSidebarOpen(false);
    } else if (target === 'notes') {
      toggleSidebar();
    } else if (target === 'settings') {
      setSidebarOpen(false);
      openModal('settings');
    }
  };

  const isDashboardActive = activeView === 'dashboard' && !sidebarOpen;
  const isCalendarActive = activeView === 'calendar' && !sidebarOpen;
  const isNotesActive = sidebarOpen || (activeView === 'editor' && !sidebarOpen);
  const isSettingsActive = activeModal === 'settings';

  return (
    <nav className={styles.mobileBottomNav} aria-label="Navegación móvil">
      <button
        type="button"
        className={`${styles.navBtn} ${isDashboardActive ? styles.active : ''}`}
        onClick={() => handleNavClick('dashboard')}
        id="mobileNavDashboard"
        aria-label="Ir a Inicio"
      >
        <LayoutDashboard size={20} className={styles.icon} />
        <span>Inicio</span>
      </button>

      <button
        type="button"
        className={`${styles.navBtn} ${isCalendarActive ? styles.active : ''}`}
        onClick={() => handleNavClick('calendar')}
        id="mobileNavCalendar"
        aria-label="Ir a Agenda"
      >
        <CalendarIcon size={20} className={styles.icon} />
        <span>Agenda</span>
      </button>

      <button
        type="button"
        className={`${styles.navBtn} ${isNotesActive ? styles.active : ''}`}
        onClick={() => handleNavClick('notes')}
        id="mobileNavNotes"
        aria-label="Abrir Carpeta de materias y notas"
      >
        <Folder size={20} className={styles.icon} />
        <span>Carpeta</span>
      </button>

      <button
        type="button"
        className={`${styles.navBtn} ${isSettingsActive ? styles.active : ''}`}
        onClick={() => handleNavClick('settings')}
        id="mobileNavSettings"
        aria-label="Abrir Ajustes"
      >
        <Settings size={20} className={styles.icon} />
        <span>Ajustes</span>
      </button>
    </nav>
  );
};
