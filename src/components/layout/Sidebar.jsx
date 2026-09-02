import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  FilePlus,
  ChevronRight,
  Star,
  Trash2,
  Edit2,
  FileText,
  Copy,
  Search,
  X,
  Plus,
  Archive,
  ArchiveRestore,
  MoreVertical,
  ChevronDown,
  Clock,
  Share2
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import { formatDate } from '../../utils/helpers.js';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  const subjects = useNotesStore((state) => state.subjects);
  const activeSubjectId = useNotesStore((state) => state.activeSubjectId);
  const activeNoteId = useNotesStore((state) => state.activeNoteId);
  const deletedItems = useNotesStore((state) => state.deletedItems);

  const setActiveNote = useNotesStore((state) => state.setActiveNote);
  const setActiveSubject = useNotesStore((state) => state.setActiveSubject);
  const setActiveView = useNotesStore((state) => state.setActiveView);
  const addNote = useNotesStore((state) => state.addNote);
  const duplicateNote = useNotesStore((state) => state.duplicateNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const toggleFavoriteNote = useNotesStore((state) => state.toggleFavoriteNote);
  const deleteSubject = useNotesStore((state) => state.deleteSubject);
  const toggleArchiveSubject = useNotesStore((state) => state.toggleArchiveSubject);

  const openModal = useUIStore((state) => state.openModal);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const rawSearchQuery = useUIStore((state) => state.searchQuery);
  const searchQuery = rawSearchQuery.toLowerCase().trim();
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const addToast = useUIStore((state) => state.addToast);
  const sidebarView = useUIStore((state) => state.sidebarView);
  const setSidebarView = useUIStore((state) => state.setSidebarView);

  const expandSubjectsSetting = useSettingsStore((state) => state.expandSubjects);

  const [expandedSubjects, setExpandedSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem('expanded_subjects');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) { }
    const initial = {};
    if (activeSubjectId) {
      initial[activeSubjectId] = true;
    }
    return initial;
  });

  const [showArchived, setShowArchived] = useState(() => {
    try {
      return localStorage.getItem('sidebar_show_archived') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [openMenuSubjectId, setOpenMenuSubjectId] = useState(null);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [activeFlyoutSubjectId, setActiveFlyoutSubjectId] = useState(null);
  const [flyoutPosition, setFlyoutPosition] = useState({ top: 0, left: 0 });
  const [showViewPicker, setShowViewPicker] = useState(false);
  const [viewPickerPos, setViewPickerPos] = useState({ top: 0, left: 0 });
  const viewPickerHoverTimer = useRef(null);

  const handleViewPickerMouseEnter = (e) => {
    if (viewPickerHoverTimer.current) {
      clearTimeout(viewPickerHoverTimer.current);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setViewPickerPos({ top: rect.top, left: rect.right + 4 });
    setShowViewPicker(true);
  };

  const handleViewPickerMouseLeave = () => {
    viewPickerHoverTimer.current = setTimeout(() => {
      setShowViewPicker(false);
    }, 220);
  };

  const handleFlyoutMouseEnter = () => {
    if (viewPickerHoverTimer.current) {
      clearTimeout(viewPickerHoverTimer.current);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('expanded_subjects', JSON.stringify(expandedSubjects));
    } catch (e) { }
  }, [expandedSubjects]);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_show_archived', String(showArchived));
    } catch (e) { }
  }, [showArchived]);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_view', sidebarView);
    } catch (e) { }
  }, [sidebarView]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(`.${styles.optionsWrapper}`)) {
        setOpenMenuSubjectId(null);
      }
      if (!e.target.closest(`.${styles.newDropdownWrapper}`)) {
        setShowNewDropdown(false);
      }
      if (!e.target.closest(`.${styles.subjectFlyout}`) && !e.target.closest(`.${styles.subjectHeader}`)) {
        setActiveFlyoutSubjectId(null);
      }
      if (!e.target.closest(`.${styles.collapsedViewToggleWrapper}`) && !e.target.closest(`.${styles.collapsedViewFlyout}`)) {
        setShowViewPicker(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenMenuSubjectId(null);
        setShowNewDropdown(false);
        setActiveFlyoutSubjectId(null);
        setShowViewPicker(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleExpand = (subjectId, e) => {
    if (e) e.stopPropagation();
    setExpandedSubjects((prev) => {
      const current = prev[subjectId] !== undefined
        ? prev[subjectId]
        : (expandSubjectsSetting || activeSubjectId === subjectId);
      return {
        ...prev,
        [subjectId]: !current
      };
    });
  };

  const handleSelectNote = (subjectId, noteId) => {
    setActiveNote(subjectId, noteId);
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: true }));
    setActiveView('editor');
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleNewNoteForSubject = (subjectId, e) => {
    if (e) e.stopPropagation();
    const note = addNote(subjectId, { title: 'Nuevo Apunte' });
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: true }));
    if (note && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleNewNote = () => {
    const targetSubId = activeSubjectId || subjects.find((s) => !s.archived)?.id || subjects[0]?.id;
    if (!targetSubId) {
      openModal('subject');
      return;
    }
    const note = addNote(targetSubId, { title: 'Nuevo Apunte' });
    setExpandedSubjects((prev) => ({ ...prev, [targetSubId]: true }));
    if (note && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleToggleArchive = (subject, e) => {
    if (e) e.stopPropagation();
    toggleArchiveSubject(subject.id);
    addToast({
      message: subject.archived ? 'Materia desarchivada' : 'Materia archivada',
      type: 'info'
    });
  };

  const getSubjectInitials = (subject) => {
    if (subject.code) return subject.code.slice(0, 3).toUpperCase();
    const words = subject.name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return subject.name.slice(0, 2).toUpperCase();
  };

  const filteredSubjects = subjects
    .map((subject) => {
      const matchesSubject =
        subject.name.toLowerCase().includes(searchQuery) ||
        (subject.code && subject.code.toLowerCase().includes(searchQuery));

      const matchingNotes = subject.notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery) ||
          n.content.toLowerCase().includes(searchQuery)
      );

      if (!searchQuery || matchesSubject || matchingNotes.length > 0) {
        return {
          ...subject,
          notes: searchQuery && !matchesSubject ? matchingNotes : subject.notes
        };
      }
      return null;
    })
    .filter(Boolean);

  const activeSubjects = filteredSubjects.filter((s) => !s.archived);
  const archivedSubjects = filteredSubjects.filter((s) => !!s.archived);
  const totalArchivedCount = subjects.filter((s) => s.archived).length;

  const allActiveNotes = subjects
    .filter((s) => !s.archived)
    .flatMap((s) =>
      (s.notes || []).map((n) => ({
        ...n,
        subjectId: s.id,
        subjectName: s.name,
        subjectColor: s.color || 'var(--accent-blue)'
      }))
    );

  const recentNotes = allActiveNotes
    .filter((n) => !searchQuery || n.title.toLowerCase().includes(searchQuery) || n.content.toLowerCase().includes(searchQuery))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const favoriteNotes = allActiveNotes
    .filter((n) => n.favorite)
    .filter((n) => !searchQuery || n.title.toLowerCase().includes(searchQuery) || n.content.toLowerCase().includes(searchQuery))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const handleSubjectHeaderClick = (subject, e) => {
    if (sidebarCollapsed) {
      e.stopPropagation();
      if (activeFlyoutSubjectId === subject.id) {
        setActiveFlyoutSubjectId(null);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        const topPos = Math.min(rect.top, window.innerHeight - 380);
        setFlyoutPosition({
          top: Math.max(10, topPos),
          left: rect.right + 10
        });
        setActiveFlyoutSubjectId(subject.id);
      }
    } else {
      setActiveSubject(subject.id);
      setExpandedSubjects((prev) => {
        const current = prev[subject.id] !== undefined
          ? prev[subject.id]
          : (expandSubjectsSetting || activeSubjectId === subject.id);
        return { ...prev, [subject.id]: !current };
      });
    }
  };

  const renderSubjectFolder = (subject, isArchived = false) => {
    const isExpanded = expandedSubjects[subject.id] !== undefined
      ? Boolean(expandedSubjects[subject.id]) || Boolean(searchQuery)
      : (expandSubjectsSetting || activeSubjectId === subject.id || Boolean(searchQuery));
    const isActiveSubject = activeSubjectId === subject.id;
    const initials = getSubjectInitials(subject);

    return (
      <div key={subject.id} className={`${styles.subjectGroup} ${isArchived ? styles.archivedGroup : ''}`}>
        <div
          className={`${styles.subjectHeader} ${isActiveSubject ? styles.active : ''}`}
          onClick={(e) => handleSubjectHeaderClick(subject, e)}
        >
          <span
            className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
            onClick={(e) => toggleExpand(subject.id, e)}
          >
            <ChevronRight size={14} />
          </span>

          <div
            className={styles.subjectIconBadge}
            style={{
              backgroundColor: isArchived ? 'var(--text-muted)' : (subject.color || 'var(--accent-blue)'),
              opacity: isArchived ? 0.75 : 1
            }}
            title={subject.name}
          >
            {initials}
          </div>

          <div className={styles.subjectInfo}>
            <span className={styles.subjectTitle}>{subject.name}</span>
            {subject.code && <span className={styles.codeBadge}>{subject.code}</span>}
          </div>

          <span className={styles.notesCount}>{subject.notes.length}</span>

          <div className={styles.headerHoverActions}>
            {!isArchived && (
              <button
                type="button"
                className={styles.miniActionBtn}
                onClick={(e) => handleNewNoteForSubject(subject.id, e)}
                title="Crear apunte"
              >
                <Plus size={13} />
              </button>
            )}

            <div className={styles.optionsWrapper}>
              <button
                type="button"
                className={`${styles.miniActionBtn} ${openMenuSubjectId === subject.id ? styles.activeMenuBtn : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuSubjectId(openMenuSubjectId === subject.id ? null : subject.id);
                }}
                title="Más opciones"
              >
                <MoreVertical size={13} />
              </button>

              {openMenuSubjectId === subject.id && (
                <div className={styles.subjectOptionsMenu} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.subjectMenuItem}
                    onClick={() => {
                      setOpenMenuSubjectId(null);
                      openModal('subject', subject);
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Editar materia</span>
                  </button>

                  <button
                    type="button"
                    className={styles.subjectMenuItem}
                    onClick={() => {
                      setOpenMenuSubjectId(null);
                      openModal('export', { subject });
                    }}
                  >
                    <Share2 size={13} color="var(--accent-blue)" />
                    <span>Compartir materia</span>
                  </button>

                  <button
                    type="button"
                    className={styles.subjectMenuItem}
                    onClick={(e) => {
                      setOpenMenuSubjectId(null);
                      handleToggleArchive(subject, e);
                    }}
                  >
                    {isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                    <span>{isArchived ? 'Desarchivar' : 'Archivar'}</span>
                  </button>

                  <div className={styles.menuDivider} />

                  <button
                    type="button"
                    className={`${styles.subjectMenuItem} ${styles.dangerMenuItem}`}
                    onClick={() => {
                      setOpenMenuSubjectId(null);
                      if (window.confirm('¿Seguro que querés mandar esta materia a la papelera?')) {
                        deleteSubject(subject.id);
                        addToast({ message: 'Materia enviada a la papelera', type: 'info' });
                      }
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Eliminar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.notesList}>
            {subject.notes.length === 0 ? (
              <div className={styles.emptyNoteItem}>
                <span>Sin apuntes</span>
              </div>
            ) : (
              subject.notes.map((note) => {
                const isActiveNote = activeNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    className={`${styles.noteItem} ${isActiveNote ? styles.active : ''}`}
                    onClick={() => handleSelectNote(subject.id, note.id)}
                  >
                    <div className={styles.noteTitleWrapper}>
                      <FileText size={13} className={styles.noteDocIcon} />
                      <span className={styles.noteTitleText}>
                        {note.title || 'Apunte sin título'}
                      </span>
                    </div>

                    {note.favorite && (
                      <Star size={12} className={styles.favoriteStar} fill="currentColor" />
                    )}

                    <div className={styles.noteActions}>
                      <button
                        type="button"
                        className={styles.noteActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateNote(note.id);
                        }}
                        title="Duplicar"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        className={styles.noteActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFlatNoteList = (notes, emptyText, emptyIcon) => {
    if (notes.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}>{emptyIcon}</div>
          <div>{searchQuery ? 'No se encontraron resultados' : emptyText}</div>
        </div>
      );
    }

    return notes.map((note) => {
      const isActive = activeNoteId === note.id;
      return (
        <div
          key={note.id}
          className={`${styles.flatNoteItem} ${isActive ? styles.active : ''}`}
          onClick={() => handleSelectNote(note.subjectId, note.id)}
          title={`${note.title || 'Apunte sin título'} (${note.subjectName})`}
        >
          <div className={styles.flatNoteIconBox}>
            <span className={styles.flatNoteDot} style={{ backgroundColor: note.subjectColor }} />
            <FileText size={14} className={styles.flatNoteIcon} />
          </div>
          <div className={styles.flatNoteContent}>
            <span className={styles.flatNoteTitle}>{note.title || 'Apunte sin título'}</span>
            <div className={styles.flatNoteMeta}>
              <span className={styles.flatNoteSubject}>{note.subjectName}</span>
              <span>•</span>
              <span>{formatDate(note.updatedAt)}</span>
            </div>
          </div>

          {note.favorite && (
            <Star size={12} className={styles.favoriteStar} fill="currentColor" />
          )}
        </div>
      );
    });
  };

  return (
    <aside
      className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''} ${sidebarCollapsed ? styles.collapsed : ''}`}
    >
      <div
        className={styles.mobileGrabber}
        onClick={() => setSidebarOpen(false)}
        role="button"
        tabIndex={0}
        aria-label="Cerrar cajón de materias"
      />
      <div className={styles.sidebarHeader}>
        <div className={styles.searchRow}>
          <div
            className={styles.searchBox}
            onClick={() => {
              if (sidebarCollapsed) {
                useUIStore.getState().setSidebarCollapsed(false);
              }
            }}
            title={sidebarCollapsed ? 'Buscar notas o materias' : undefined}
          >
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar notas o materias..."
              value={rawSearchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {rawSearchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className={styles.newDropdownWrapper}>
            <button
              type="button"
              className={`${styles.newIconBtn} ${showNewDropdown ? styles.activeDropdown : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowNewDropdown(!showNewDropdown);
              }}
              title="Crear nueva materia o apunte"
            >
              <Plus size={18} />
            </button>

            {showNewDropdown && (
              <div className={styles.newMenuDropdown} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={styles.newMenuItem}
                  onClick={() => {
                    setShowNewDropdown(false);
                    openModal('subject');
                  }}
                >
                  <FolderPlus size={14} color="var(--accent-blue)" />
                  <span>Nueva Materia</span>
                </button>

                <button
                  type="button"
                  className={styles.newMenuItem}
                  onClick={() => {
                    setShowNewDropdown(false);
                    handleNewNote();
                  }}
                >
                  <FilePlus size={14} color="var(--accent-green)" />
                  <span>Nuevo Apunte</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.viewToggles}>
          <button
            type="button"
            className={`${styles.viewBtn} ${sidebarView === 'subjects' ? styles.activeView : ''}`}
            onClick={(e) => {
              setSidebarView('subjects');
              e.currentTarget.blur();
            }}
            title="Materias"
          >
            <Folder size={14} />
            <span className={styles.viewBtnLabel}>Materias</span>
          </button>

          <button
            type="button"
            className={`${styles.viewBtn} ${sidebarView === 'recent' ? styles.activeView : ''}`}
            onClick={(e) => {
              setSidebarView('recent');
              e.currentTarget.blur();
            }}
            title="Recientes"
          >
            <Clock size={14} />
            <span className={styles.viewBtnLabel}>Recientes</span>
          </button>

          <button
            type="button"
            className={`${styles.viewBtn} ${sidebarView === 'favorites' ? styles.activeView : ''}`}
            onClick={(e) => {
              setSidebarView('favorites');
              e.currentTarget.blur();
            }}
            title="Favoritos"
          >
            <Star size={14} />
            <span className={styles.viewBtnLabel}>Favoritos</span>
          </button>
        </div>
      </div>

      <div className={styles.subjectsContainer}>
        {sidebarView === 'subjects' && (
          activeSubjects.length === 0 && (!showArchived || archivedSubjects.length === 0) ? (
            <div className={styles.emptyState}>
              {searchQuery ? 'No se encontraron resultados' : 'No tenés materias creadas todavía.'}
            </div>
          ) : (
            <>
              {activeSubjects.map((subject) => renderSubjectFolder(subject, false))}

              {showArchived && (
                <div className={styles.archivedSection}>
                  <div className={styles.archivedSectionHeader}>
                    <Archive size={13} />
                    <span>Materias Archivadas ({totalArchivedCount})</span>
                  </div>
                  {archivedSubjects.length === 0 ? (
                    <div className={styles.emptyNoteItem}>
                      <span>No hay materias archivadas coincidentes</span>
                    </div>
                  ) : (
                    archivedSubjects.map((subject) => renderSubjectFolder(subject, true))
                  )}
                </div>
              )}
            </>
          )
        )}

        {sidebarView === 'recent' && (
          renderFlatNoteList(recentNotes, 'No hay apuntes recientes para mostrar.', <Clock size={24} />)
        )}

        {sidebarView === 'favorites' && (
          renderFlatNoteList(favoriteNotes, 'No tenés apuntes favoritos guardados.', <Star size={24} />)
        )}
      </div>

      <div className={styles.sidebarFooter}>
        <button
          type="button"
          className={`${styles.footerBtn} ${showArchived ? styles.active : ''}`}
          onClick={() => setShowArchived(!showArchived)}
          title={showArchived ? 'Ocultar materias archivadas' : 'Ver materias archivadas'}
        >
          <Archive size={14} />
          <span>Archivadas ({totalArchivedCount})</span>
        </button>

        <button
          type="button"
          className={styles.footerBtn}
          onClick={() => {
            if (window.innerWidth <= 768) setSidebarOpen(false);
            openModal('trash');
          }}
          title="Papelera de reciclaje"
        >
          <Trash2 size={14} />
          <span>Papelera ({deletedItems?.notes?.length || (Array.isArray(deletedItems) ? deletedItems.length : 0)})</span>
        </button>
      </div>

      {activeFlyoutSubjectId && (() => {
        const flyoutSub = subjects.find((s) => s.id === activeFlyoutSubjectId);
        if (!flyoutSub) return null;
        const flyoutInitials = getSubjectInitials(flyoutSub);

        return (
          <div
            className={styles.subjectFlyout}
            style={{ top: `${flyoutPosition.top}px`, left: `${flyoutPosition.left}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.flyoutHeader}>
              <div className={styles.flyoutHeaderLeft}>
                <div
                  className={styles.flyoutSubjectBadge}
                  style={{ backgroundColor: flyoutSub.color || 'var(--accent-blue)' }}
                >
                  {flyoutInitials}
                </div>
                <h3 className={styles.flyoutTitle}>{flyoutSub.name}</h3>
              </div>
              <button
                type="button"
                className={styles.flyoutNewNoteBtn}
                onClick={(e) => {
                  handleNewNoteForSubject(flyoutSub.id, e);
                  setActiveFlyoutSubjectId(null);
                }}
                title="Crear apunte en esta materia"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className={styles.flyoutNotesList}>
              {flyoutSub.notes && flyoutSub.notes.length > 0 ? (
                flyoutSub.notes.map((note) => (
                  <div
                    key={note.id}
                    className={`${styles.flyoutNoteItem} ${activeNoteId === note.id ? styles.active : ''}`}
                    onClick={() => {
                      handleSelectNote(flyoutSub.id, note.id);
                      setActiveFlyoutSubjectId(null);
                    }}
                  >
                    <FileText size={15} color="var(--text-muted)" />
                    <div className={styles.flyoutNoteContent}>
                      <span className={styles.flyoutNoteTitle}>{note.title || 'Apunte sin título'}</span>
                      <span className={styles.flyoutNoteMeta}>{formatDate(note.updatedAt || note.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.flyoutEmpty}>
                  <p>No hay apuntes todavía</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      handleNewNoteForSubject(flyoutSub.id, e);
                      setActiveFlyoutSubjectId(null);
                    }}
                  >
                    <Plus size={13} />
                    <span>Crear apunte</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </aside>
  );
};
