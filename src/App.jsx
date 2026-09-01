import React, { useEffect } from 'react';
import { Header } from './components/layout/Header.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { MobileOverlay } from './components/layout/MobileOverlay.jsx';
import { WelcomeView } from './components/views/WelcomeView.jsx';
import { DashboardView } from './components/views/DashboardView.jsx';
import { CalendarView } from './components/views/CalendarView.jsx';
import { NoteEditor } from './components/editor/NoteEditor.jsx';
import { SubjectModal } from './components/modals/SubjectModal.jsx';
import { SettingsModal } from './components/modals/SettingsModal.jsx';
import { TrashModal } from './components/modals/TrashModal.jsx';
import { LinkNoteModal } from './components/modals/LinkNoteModal.jsx';
import { TableModal } from './components/modals/TableModal.jsx';
import { ToastContainer } from './components/common/ToastContainer.jsx';

import { useNotesStore } from './store/useNotesStore.js';
import { useUIStore } from './store/useUIStore.js';
import { useSettingsStore } from './store/useSettingsStore.js';

export const App = () => {
  const activeView = useNotesStore((state) => state.activeView);
  const subjects = useNotesStore((state) => state.subjects);
  const activeModal = useUIStore((state) => state.activeModal);
  const openModal = useUIStore((state) => state.openModal);
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'dark');
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        if (useUIStore.getState().sidebarCollapsed) {
          useUIStore.getState().setSidebarCollapsed(false);
        }
        setTimeout(() => {
          const searchInput = document.querySelector('input[placeholder*="Buscar"]');
          if (searchInput) searchInput.focus();
        }, 50);
      }

      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openModal('subject');
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        useUIStore.getState().toggleSidebarCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderCurrentView = () => {
    if (subjects.length === 0 || activeView === 'welcome') {
      return <WelcomeView />;
    }
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'calendar':
        return <CalendarView />;
      case 'editor':
      default:
        return <NoteEditor />;
    }
  };

  return (
    <div className="app-container">
      <Header />

      <div className="app-main">
        <MobileOverlay />
        <Sidebar />
        <main className="app-content">{renderCurrentView()}</main>
      </div>

      {activeModal === 'subject' && <SubjectModal />}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'trash' && <TrashModal />}
      {activeModal === 'linkNote' && <LinkNoteModal />}
      {(activeModal === 'table' || activeModal === 'insertTable') && <TableModal />}

      <ToastContainer />
    </div>
  );
};
