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
import { ExportModal } from './components/modals/ExportModal.jsx';
import { ToastContainer } from './components/common/ToastContainer.jsx';
import { DevConsole } from './components/common/DevConsole.jsx';
import { loadRemoteSharedContent } from './utils/exportHelpers.js';
import { loggerService } from './services/loggerService.js';

import { useNotesStore } from './store/useNotesStore.js';
import { useUIStore } from './store/useUIStore.js';
import { useSettingsStore } from './store/useSettingsStore.js';

export const App = () => {
  const activeView = useNotesStore((state) => state.activeView);
  const subjects = useNotesStore((state) => state.subjects);
  const activeModal = useUIStore((state) => state.activeModal);
  const openModal = useUIStore((state) => state.openModal);
  const addToast = useUIStore((state) => state.addToast);
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'dark');
  }, [theme]);

  useEffect(() => {
    loggerService.init();
    window.__notesStore = useNotesStore.getState();
    window.__settingsStore = useSettingsStore.getState();
    window.__uiStore = useUIStore.getState();
  }, []);

  useEffect(() => {
    const handleRemoteContent = async () => {
      try {
        const result = await loadRemoteSharedContent();
        if (!result || !result.data) return;

        const store = useNotesStore.getState();

        if (result.type === 'subject') {
          const subData = result.data;
          let subName = subData.name || 'Materia Compartida';
          let count = 0;
          while (store.subjects.some((s) => s.name.toLowerCase() === subName.toLowerCase())) {
            count++;
            subName = `${subData.name || 'Materia Compartida'} (${count})`;
          }

          const newSub = store.addSubject({
            name: subName,
            code: subData.code || '',
            professor: subData.professor || '',
            color: subData.color || '#3b82f6',
            schedule: subData.schedule || []
          });

          if (newSub && Array.isArray(subData.notes)) {
            subData.notes.forEach((n) => {
              store.addNote(newSub.id, {
                title: n.title,
                content: n.content,
                tags: n.tags || ['compartido'],
                favorite: !!n.favorite
              });
            });

            addToast({ message: `Materia "${subName}" importada desde ${result.source}`, type: 'success' });
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          const noteData = result.data;
          const noteTitle = noteData.title || noteData.t || 'Apunte Compartido';
          const noteContent = noteData.content || noteData.c || '';
          const subName = noteData.subjectName || noteData.subject || noteData.s || 'Compartidos';

          let targetSub = store.subjects.find((s) => s.name.toLowerCase() === subName.toLowerCase() && !s.archived);
          if (!targetSub) {
            targetSub = store.addSubject({
              name: subName,
              color: noteData.subjectColor || noteData.sc || '#3b82f6'
            });
          }

          if (targetSub) {
            const newNote = store.addNote(targetSub.id, {
              title: `${noteTitle} (Importado)`,
              content: noteContent,
              tags: noteData.tags || ['compartido']
            });

            if (newNote) {
              store.setActiveNote(targetSub.id, newNote.id);
              addToast({ message: `Apunte "${noteTitle}" importado desde ${result.source}`, type: 'success' });
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }
      } catch (err) {
        console.error('Error importing remote shared content:', err);
      }
    };

    handleRemoteContent();
  }, []);

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

      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        useUIStore.getState().toggleConsole();
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
      {(activeModal === 'export' || activeModal === 'share') && <ExportModal />}

      <ToastContainer />
      <DevConsole />
    </div>
  );
};
