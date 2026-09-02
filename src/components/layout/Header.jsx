import React from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Settings,
  RefreshCw,
  FileText,
  Download,
  Upload,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { useGitHubStore } from '../../store/useGitHubStore.js';
import styles from './Header.module.css';

export const Header = () => {
  const activeView = useNotesStore((state) => state.activeView);
  const setActiveView = useNotesStore((state) => state.setActiveView);
  const openModal = useUIStore((state) => state.openModal);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapse = useUIStore((state) => state.toggleSidebarCollapse);
  const addToast = useUIStore((state) => state.addToast);

  const { isAuthenticated, syncStatus, sync, forcePush, forcePull } = useGitHubStore();

  const handleForcePull = async () => {
    if (window.confirm('¿Descargar datos de GitHub? Esto reemplazará tus notas locales con los datos remotos de GitHub.')) {
      const res = await forcePull();
      if (res.success) {
        addToast({ message: 'Datos descargados desde GitHub', type: 'success' });
      } else {
        addToast({ message: `Error al descargar: ${res.error}`, type: 'error' });
      }
    }
  };

  const handleForcePush = async () => {
    if (window.confirm('¿Subir datos a GitHub? Esto sobreescribirá los datos en tu repositorio de GitHub con tus notas locales.')) {
      const res = await forcePush();
      if (res.success) {
        addToast({ message: 'Datos subidos forzadamente a GitHub', type: 'success' });
      } else {
        addToast({ message: `Error al subir: ${res.error}`, type: 'error' });
      }
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.sidebarToggleBtn}
          onClick={toggleSidebarCollapse}
          title={sidebarCollapsed ? 'Expandir barra lateral (Ctrl+\\)' : 'Ocultar barra lateral (Ctrl+\\)'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className={styles.brand} onClick={() => setActiveView('dashboard')}>
          <BookOpen size={20} color="var(--accent-blue)" className={styles.logoIcon} />
          <span>Escriba</span>
        </div>

        <nav className={styles.navTabs}>
          <button
            type="button"
            className={`${styles.navTab} ${activeView === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutDashboard size={15} />
            <span>Panel</span>
          </button>
          <button
            type="button"
            className={`${styles.navTab} ${activeView === 'editor' ? styles.active : ''}`}
            onClick={() => setActiveView('editor')}
          >
            <FileText size={15} />
            <span>Apuntes</span>
          </button>
          <button
            type="button"
            className={`${styles.navTab} ${activeView === 'calendar' ? styles.active : ''}`}
            onClick={() => setActiveView('calendar')}
          >
            <CalendarIcon size={15} />
            <span>Calendario</span>
          </button>
        </nav>
      </div>

      <div className={styles.rightSection}>
        {isAuthenticated && (
          <div className={styles.githubGroup}>
            <button
              type="button"
              className={`${styles.syncBtn} ${syncStatus === 'syncing'
                ? styles.syncing
                : syncStatus === 'success'
                  ? styles.success
                  : syncStatus === 'error'
                    ? styles.error
                    : ''
                }`}
              onClick={() => sync()}
              disabled={syncStatus === 'syncing'}
              title="Sincronización con GitHub"
            >
              <RefreshCw size={14} className={syncStatus === 'syncing' ? styles.spin : ''} />
              <span>
                {syncStatus === 'syncing'
                  ? 'Sincronizando...'
                  : syncStatus === 'success'
                    ? 'Sincronizado'
                    : 'Sincronizar'}
              </span>
            </button>

            <button
              type="button"
              className={`btn-icon ${styles.syncIconBtn}`}
              onClick={handleForcePull}
              disabled={syncStatus === 'syncing'}
              title="Pull"
            >
              <Download size={15} />
            </button>

            <button
              type="button"
              className={`btn-icon ${styles.syncIconBtn}`}
              onClick={handleForcePush}
              disabled={syncStatus === 'syncing'}
              title="Push"
            >
              <Upload size={15} />
            </button>
          </div>
        )}

        <button
          type="button"
          className="btn-icon"
          onClick={() => openModal('settings')}
          title="Ajustes"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
