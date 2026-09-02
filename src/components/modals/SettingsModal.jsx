import React, { useState, useRef } from 'react';
import {
  SlidersHorizontal,
  Paintbrush,
  HardDrive,
  Database,
  HelpCircle,
  X,
  Settings,
  Folder,
  FolderOpen,
  FolderPlus,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Undo2,
  Broom,
  ExternalLink,
  BookOpen,
  FileText,
  Keyboard,
  ShieldCheck,
  Check,
  Terminal
} from 'lucide-react';
import { GitHubIcon } from '../common/Icons.jsx';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import { useGitHubStore } from '../../store/useGitHubStore.js';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { storageService } from '../../services/storageService.js';
import styles from './SettingsModal.module.css';

const THEMES = [
  {
    id: 'dark',
    name: 'Oscuro',
    bg: '#1a1a1a',
    previewBg: '#121212',
    headerBg: '#1e1e1e',
    sidebarBg: '#181818',
    item1: '#4361ee',
    item2: '#2ec4b6',
    contentBg: '#121212',
    lineMain: '#f5f5f5',
    lineSub: '#888888'
  },
  {
    id: 'light',
    name: 'Claro',
    bg: '#ffffff',
    previewBg: '#f8f9fa',
    headerBg: '#ffffff',
    sidebarBg: '#f1f3f5',
    item1: '#4361ee',
    item2: '#2ec4b6',
    contentBg: '#ffffff',
    lineMain: '#212529',
    lineSub: '#6c757d'
  },
  {
    id: 'sakura',
    name: 'Sakura',
    bg: '#faf4ed',
    previewBg: '#faf4ed',
    headerBg: '#ffffff',
    sidebarBg: '#f2e9e1',
    item1: '#eb6f92',
    item2: '#907aa9',
    contentBg: '#faf4ed',
    lineMain: '#575279',
    lineSub: '#9893a5'
  },
  {
    id: 'github',
    name: 'GitHub',
    bg: '#0d1117',
    previewBg: '#0d1117',
    headerBg: '#161b22',
    sidebarBg: '#161b22',
    item1: '#2f81f7',
    item2: '#3fb950',
    contentBg: '#0d1117',
    lineMain: '#e6edf3',
    lineSub: '#6e7681'
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    bg: '#1e1e2e',
    previewBg: '#1e1e2e',
    headerBg: '#181825',
    sidebarBg: '#181825',
    item1: '#cba6f7',
    item2: '#89b4fa',
    contentBg: '#1e1e2e',
    lineMain: '#cdd6f4',
    lineSub: '#7f849c'
  },
  {
    id: 'blue',
    name: 'Azul',
    bg: '#0f1419',
    previewBg: '#0f172a',
    headerBg: '#1e293b',
    sidebarBg: '#131d31',
    item1: '#38bdf8',
    item2: '#38bdf8',
    contentBg: '#0f172a',
    lineMain: '#f1f5f9',
    lineSub: '#94a3b8'
  },
  {
    id: 'matcha',
    name: 'Matcha',
    bg: '#151e18',
    previewBg: '#151e18',
    headerBg: '#1d2a22',
    sidebarBg: '#1d2a22',
    item1: '#52b788',
    item2: '#40916c',
    contentBg: '#151e18',
    lineMain: '#e8f5e9',
    lineSub: '#729d89'
  },
  {
    id: 'unq',
    name: 'UNQ',
    bg: '#0a0a0a',
    previewBg: '#0a0a0a',
    headerBg: '#141414',
    sidebarBg: '#0f0f0f',
    item1: '#990000',
    item2: '#990000',
    contentBg: '#0a0a0a',
    lineMain: '#e5e5e5',
    lineSub: '#a1a1a1'
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    bg: '#2d1b1b',
    previewBg: '#1c0f13',
    headerBg: '#2b171d',
    sidebarBg: '#231218',
    item1: '#ff758f',
    item2: '#e63946',
    contentBg: '#1c0f13',
    lineMain: '#fff5f5',
    lineSub: '#c4a8a8'
  }
];

const FONTS = [
  { value: 'Inter, sans-serif', label: 'Inter (Predeterminada, Moderna)' },
  { value: "'Roboto', sans-serif", label: 'Roboto (Limpia, Lectura fácil)' },
  { value: "'Outfit', sans-serif", label: 'Outfit (Geométrica, Estilizada)' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono (Programador)' }
];

const HOTKEYS = [
  { desc: 'Nuevo Apunte', key: 'Ctrl + N' },
  { desc: 'Guardar cambios', key: 'Ctrl + S' },
  { desc: 'Buscar apuntes / materias', key: 'Ctrl + F / Ctrl + K' },
  { desc: 'Insertar bloque de código', key: 'Ctrl + Alt + C' },
  { desc: 'Modo Matemático (KaTeX)', key: 'Ctrl + M' },
  { desc: 'Modo Compacto / Sidebar', key: 'Ctrl + \\' },
  { desc: 'Centrar Texto', key: 'Ctrl + T' },
  { desc: 'Deshacer / Rehacer', key: 'Ctrl + Z / Ctrl + Y' },
  { desc: 'Consola de depuración (Debug)', key: 'Ctrl + Alt + D' }
];

export const SettingsModal = () => {
  const settings = useSettingsStore();
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setFontSize = useSettingsStore((state) => state.setFontSize);
  const setFontFamily = useSettingsStore((state) => state.setFontFamily);
  const resetSettings = useSettingsStore((state) => state.resetSettings);

  const subjects = useNotesStore((state) => state.subjects);
  const exportDataJSON = useNotesStore((state) => state.exportDataJSON);
  const importDataJSON = useNotesStore((state) => state.importDataJSON);
  const deduplicateNotes = useNotesStore((state) => state.deduplicateNotes);

  const {
    token,
    username,
    repoName,
    isAuthenticated,
    connectToken,
    disconnect,
    sync,
    forcePush,
    forcePull,
    syncStatus,
    lastSyncTime
  } = useGitHubStore();

  const closeModal = useUIStore((state) => state.closeModal);
  const addToast = useUIStore((state) => state.addToast);
  const settingsTab = useUIStore((state) => state.settingsTab || 'general');
  const setSettingsTab = useUIStore((state) => state.setSettingsTab);

  const [ghTokenInput, setGhTokenInput] = useState('');
  const [ghRepoInput, setGhRepoInput] = useState(repoName || 'escriba-notes');
  const [localFolder, setLocalFolder] = useState(
    localStorage.getItem('local_storage_folder_path') || ''
  );

  const fileInputRef = useRef(null);

  const totalSubjects = subjects.length;
  const allNotes = subjects.flatMap((s) => s.notes || []);
  const totalNotes = allNotes.length;
  const totalWords = allNotes.reduce((acc, n) => {
    const text = (n.content || '').replace(/<[^>]*>/g, ' ').trim();
    return acc + (text ? text.split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  const handleConnectGitHub = async (e) => {
    e.preventDefault();
    if (!ghTokenInput.trim()) return;
    const res = await connectToken(ghTokenInput.trim(), ghRepoInput.trim());
    if (res.success) {
      addToast({ message: `Conectado como @${res.username}`, type: 'success' });
      setGhTokenInput('');
    } else {
      addToast({ message: res.error, type: 'error' });
    }
  };

  const handleSelectFolder = async () => {
    const selected = await storageService.selectLocalFolder();
    if (selected) {
      setLocalFolder(selected);
      localStorage.setItem('local_storage_folder_path', selected);
      addToast({ message: 'Carpeta local vinculada con éxito', type: 'success' });
    }
  };

  const handleOpenFolder = async () => {
    await storageService.openLocalFolder(localFolder);
  };

  const handleResetFolder = () => {
    localStorage.removeItem('local_storage_folder_path');
    setLocalFolder('');
    addToast({ message: 'Ruta local restablecida a predeterminada', type: 'info' });
  };

  const handleExportBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escriba-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ message: 'Copia de seguridad descargada', type: 'success' });
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = importDataJSON(ev.target.result);
      if (res.success) {
        addToast({ message: 'Carpeta importada con éxito', type: 'success' });
        closeModal();
      } else {
        addToast({ message: res.error, type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleDeduplicate = () => {
    const count = deduplicateNotes();
    if (count > 0) {
      addToast({ message: `Se eliminaron ${count} apunte(s) duplicado(s)`, type: 'success' });
    } else {
      addToast({ message: 'No se encontraron apuntes duplicados', type: 'info' });
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('¿Restablecer toda la configuración a valores predeterminados?')) {
      resetSettings();
      addToast({ message: 'Configuración restablecida', type: 'info' });
    }
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <div className={styles.titleIconBadge}>
              <Settings size={18} />
            </div>
            <span>Ajustes de Escriba</span>
          </h3>
          <button type="button" className={styles.closeBtn} onClick={closeModal} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.settingsLayout}>
          <aside className={styles.settingsSidebar}>
            <button
              type="button"
              className={`${styles.tabBtn} ${settingsTab === 'general' ? styles.active : ''}`}
              onClick={() => setSettingsTab('general')}
            >
              <SlidersHorizontal size={16} />
              <span>General</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${settingsTab === 'appearance' ? styles.active : ''}`}
              onClick={() => setSettingsTab('appearance')}
            >
              <Paintbrush size={16} />
              <span>Apariencia</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${settingsTab === 'storage' ? styles.active : ''}`}
              onClick={() => setSettingsTab('storage')}
            >
              <HardDrive size={16} />
              <span>Almacenamiento & Sync</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${settingsTab === 'data' ? styles.active : ''}`}
              onClick={() => setSettingsTab('data')}
            >
              <Database size={16} />
              <span>Datos y Carpeta</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${settingsTab === 'about' ? styles.active : ''}`}
              onClick={() => setSettingsTab('about')}
            >
              <HelpCircle size={16} />
              <span>Ayuda / Acerca de</span>
            </button>
          </aside>

          <main className={styles.settingsMain}>
            {settingsTab === 'general' && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <SlidersHorizontal size={18} />
                  <span>Guardado y Comportamiento</span>
                </div>
                <p className={styles.sectionDescription}>
                  Personalizá el comportamiento predeterminado del editor y la interfaz.
                </p>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={settings.autoSave !== false}
                    onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                  />
                  <span className={styles.checkboxLabel}>
                    Guardado automático constante (cada vez que escribís)
                  </span>
                </label>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={!!settings.expandSubjects}
                    onChange={(e) => updateSettings({ expandSubjects: e.target.checked })}
                  />
                  <span className={styles.checkboxLabel}>
                    Expandir materias por defecto en el panel lateral
                  </span>
                </label>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={settings.showWelcome !== false}
                    onChange={(e) => updateSettings({ showWelcome: e.target.checked })}
                  />
                  <span className={styles.checkboxLabel}>
                    Mostrar pantalla de bienvenida al abrir sin apuntes
                  </span>
                </label>
              </div>
            )}

            {settingsTab === 'appearance' && (
              <>
                <div className={styles.settingsSection}>
                  <div className={styles.sectionHeader}>
                    <Paintbrush size={18} />
                    <span>Tema Visual</span>
                  </div>
                  <p className={styles.sectionDescription}>
                    Elegí el esquema de colores que mejor se adapte a tu entorno de estudio.
                  </p>

                  <div className={styles.themeGrid}>
                    {THEMES.map((theme) => {
                      const isCurrent = (settings.theme || 'dark') === theme.id;
                      return (
                        <div
                          key={theme.id}
                          className={`${styles.themeCard} ${isCurrent ? styles.activeTheme : ''}`}
                          onClick={() => setTheme(theme.id)}
                        >
                          <div
                            className={styles.themeMiniWindow}
                            style={{ backgroundColor: theme.previewBg }}
                          >
                            <div
                              className={styles.miniWindowHeader}
                              style={{ backgroundColor: theme.headerBg }}
                            >
                              <div className={styles.miniDots} />
                            </div>
                            <div className={styles.miniWindowBody}>
                              <div
                                className={styles.miniWindowSidebar}
                                style={{ backgroundColor: theme.sidebarBg }}
                              >
                                <div
                                  className={styles.miniSidebarItem}
                                  style={{ backgroundColor: theme.item1 }}
                                />
                                <div
                                  className={styles.miniSidebarItem}
                                  style={{ backgroundColor: theme.item2 }}
                                />
                              </div>
                              <div
                                className={styles.miniWindowContent}
                                style={{ backgroundColor: theme.contentBg }}
                              >
                                <div
                                  className={styles.miniLineMain}
                                  style={{ backgroundColor: theme.lineMain }}
                                />
                                <div
                                  className={styles.miniLineSub}
                                  style={{ backgroundColor: theme.lineSub }}
                                />
                              </div>
                            </div>
                          </div>
                          <span className={styles.themeName}>{theme.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <div className={styles.sectionHeader}>
                    <FileText size={18} />
                    <span>Tipografía y Tamaño</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Fuente Principal</label>
                    <select
                      className={styles.select}
                      value={settings.fontFamily || 'Inter, sans-serif'}
                      onChange={(e) => setFontFamily(e.target.value)}
                    >
                      {FONTS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.formLabel}>
                      <span>Tamaño de Texto en Editor</span>
                      <span className={styles.labelValueBadge}>{settings.fontSize || 16}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      className={styles.slider}
                      value={settings.fontSize || 16}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                    />
                  </div>
                </div>
              </>
            )}

            {settingsTab === 'storage' && (
              <>
                <div className={styles.settingsSection}>
                  <div className={styles.sectionHeader}>
                    <HardDrive size={18} />
                    <span>Modo de Almacenamiento</span>
                  </div>
                  <p className={styles.sectionDescription}>
                    Elegí dónde querés guardar y respaldar tus apuntes y materias.
                  </p>

                  <div className={styles.storageModeSelector}>
                    <div
                      className={`${styles.storageOptionCard} ${(settings.storageMode || 'local') === 'github' ? styles.active : ''
                        }`}
                      onClick={() => updateSettings({ storageMode: 'github' })}
                    >
                      <div className={styles.storageCardIcon}>
                        <GitHubIcon size={22} />
                      </div>
                      <div className={styles.storageCardInfo}>
                        <strong>GitHub (Nube)</strong>
                        <span>Sincronizá tus apuntes entre distintos dispositivos con GitHub.</span>
                      </div>
                    </div>

                    <div
                      className={`${styles.storageOptionCard} ${settings.storageMode === 'local' ? styles.active : ''
                        }`}
                      onClick={() => updateSettings({ storageMode: 'local' })}
                    >
                      <div className={styles.storageCardIcon}>
                        <HardDrive size={22} />
                      </div>
                      <div className={styles.storageCardInfo}>
                        <strong>Disco Local (Offline)</strong>
                        <span>Guardá tus apuntes en la carpeta de tu equipo (archivos JSON locales).</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(settings.storageMode || 'local') === 'github' && (
                  <div className={styles.settingsSection}>
                    <div className={styles.sectionHeader}>
                      <GitHubIcon size={18} color="var(--accent-blue)" />
                      <span>Sincronización con GitHub</span>
                    </div>

                    {isAuthenticated ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            padding: '1rem 1.25rem',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <GitHubIcon size={28} color="var(--accent-blue)" />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                Conectado a @{username}
                              </div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                                Repositorio: <code>{repoName}</code>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger-subtle"
                            onClick={disconnect}
                          >
                            Desconectar
                          </button>
                        </div>

                        <label className={styles.checkboxRow}>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={settings.autoSync !== false}
                            onChange={(e) => updateSettings({ autoSync: e.target.checked })}
                          />
                          <span className={styles.checkboxLabel}>
                            Sincronización automática periódica
                          </span>
                        </label>

                        <div className={styles.buttonGroup}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => sync()}
                            disabled={syncStatus === 'syncing'}
                          >
                            <RefreshCw size={14} className={syncStatus === 'syncing' ? 'spin' : ''} />
                            <span>{syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={async () => {
                              if (window.confirm('¿Descargar datos de GitHub? Esto sobreescribirá tus notas locales con los datos remotos de GitHub.')) {
                                const res = await forcePull();
                                if (res.success) {
                                  addToast({ message: 'Datos descargados desde GitHub', type: 'success' });
                                } else {
                                  addToast({ message: `Error: ${res.error}`, type: 'error' });
                                }
                              }
                            }}
                            disabled={syncStatus === 'syncing'}
                            title="Descargar y reemplazar datos locales desde GitHub"
                          >
                            <Download size={14} />
                            <span>Forzar Pull</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={async () => {
                              if (window.confirm('¿Subir datos a GitHub? Esto sobreescribirá los datos remotos en GitHub con tus notas locales.')) {
                                const res = await forcePush();
                                if (res.success) {
                                  addToast({ message: 'Datos subidos a GitHub', type: 'success' });
                                } else {
                                  addToast({ message: `Error: ${res.error}`, type: 'error' });
                                }
                              }
                            }}
                            disabled={syncStatus === 'syncing'}
                            title="Subir y reemplazar datos en GitHub"
                          >
                            <Upload size={14} />
                            <span>Forzar Push</span>
                          </button>
                        </div>

                        {lastSyncTime && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Última sincronización: {new Date(lastSyncTime).toLocaleTimeString('es-AR')} ({new Date(lastSyncTime).toLocaleDateString('es-AR')})
                          </div>
                        )}
                      </div>
                    ) : (
                      <form
                        onSubmit={handleConnectGitHub}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
                      >
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          Ingresá un Personal Access Token (PAT) de GitHub con permisos de <code>repo</code> para respaldar tus notas de forma segura en un repositorio privado.
                        </p>
                        <input
                          type="password"
                          className={styles.input}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          value={ghTokenInput}
                          onChange={(e) => setGhTokenInput(e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Nombre del repositorio (ej: escriba-notes)"
                          value={ghRepoInput}
                          onChange={(e) => setGhRepoInput(e.target.value)}
                          required
                        />
                        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                          <GitHubIcon size={16} />
                          <span>Conectar GitHub</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {settings.storageMode === 'local' && (
                  <div className={styles.settingsSection}>
                    <div className={styles.sectionHeader}>
                      <FolderOpen size={18} />
                      <span>Configuración de Carpeta Local</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Carpeta donde se guardan tus apuntes:</label>
                      <div className={styles.pathDisplayBox}>
                        <code>{localFolder || (storageService.isElectron() ? 'Carpeta predeterminada (%appdata% / ~/.config/Escriba)' : 'Almacenamiento Local del Navegador (localStorage)')}</code>
                      </div>
                    </div>

                    <div className={styles.buttonGroup}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleSelectFolder}
                        title="Seleccionar otra carpeta"
                      >
                        <FolderPlus size={14} />
                        <span>Seleccionar Carpeta...</span>
                      </button>

                      {localFolder && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleOpenFolder}
                            title="Abrir carpeta en el explorador de archivos"
                          >
                            <ExternalLink size={14} />
                            <span>Abrir Carpeta</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleResetFolder}
                            title="Restablecer a carpeta predeterminada"
                          >
                            <Undo2 size={14} />
                            <span>Restablecer</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {settingsTab === 'data' && (
              <>
                <div className={styles.settingsSection}>
                  <div className={styles.sectionHeader}>
                    <Database size={18} />
                    <span>Estadísticas de Carpeta</span>
                  </div>

                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div
                        className={styles.statIcon}
                        style={{ background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)' }}
                      >
                        <Folder size={20} />
                      </div>
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{totalSubjects}</span>
                        <span className={styles.statLabel}>Materias</span>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div
                        className={styles.statIcon}
                        style={{ background: 'var(--accent-green-bg)', color: 'var(--accent-green)' }}
                      >
                        <FileText size={20} />
                      </div>
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{totalNotes}</span>
                        <span className={styles.statLabel}>Apuntes</span>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div
                        className={styles.statIcon}
                        style={{ background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)' }}
                      >
                        <FileText size={20} />
                      </div>
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{totalWords.toLocaleString('es-AR')}</span>
                        <span className={styles.statLabel}>Palabras</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <div className={styles.sectionHeader}>
                    <Download size={18} />
                    <span>Gestión de Carpeta</span>
                  </div>

                  <div className={styles.buttonGroup}>
                    <button type="button" className="btn btn-secondary" onClick={handleExportBackup}>
                      <Download size={14} />
                      <span>Exportar Todo (.json)</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} />
                      <span>Importar Carpeta</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleImportFile}
                    />

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleDeduplicate}
                      title="Buscar y eliminar notas duplicadas en la misma materia"
                    >
                      <Broom size={14} />
                      <span>Eliminar Duplicados</span>
                    </button>
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <div className={styles.sectionHeader}>
                    <Undo2 size={18} />
                    <span>Mantenimiento</span>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="btn btn-danger-subtle"
                      onClick={handleResetSettings}
                    >
                      <Undo2 size={14} />
                      <span>Restablecer Configuración a Predeterminada</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {settingsTab === 'about' && (
              <>
                <div className={styles.aboutHeader}>
                  <div className={styles.aboutLogoBadge}>
                    <BookOpen size={28} />
                  </div>
                  <div className={styles.aboutHeaderText}>
                    <h3>Escriba</h3>
                    <p>Tu carpeta digital de estudio</p>
                  </div>
                </div>

                <div className={styles.aboutMetaList}>
                  <div className={styles.aboutMetaItem}>
                    <span>Build</span>
                    <span>nightly (v1.0.0 React 19)</span>
                  </div>
                  <div className={styles.aboutMetaItem}>
                    <span>Desarrollado por</span>
                    <span>JustNeki</span>
                  </div>
                  <div className={styles.aboutMetaItem}>
                    <span>Código Fuente</span>
                    <a
                      href="https://github.com/PinkLittleKitty/Escriba"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>GitHub</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <div className={styles.sectionHeader}>
                    <Terminal size={18} />
                    <span>Herramientas de Desarrollador</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        closeModal();
                        useUIStore.getState().openConsole();
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Terminal size={15} />
                      <span>Abrir Consola</span>
                    </button>
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <div className={styles.sectionHeader}>
                    <Keyboard size={18} />
                    <span>Atajos de Teclado</span>
                  </div>

                  <div className={styles.hotkeysGrid}>
                    {HOTKEYS.map((h, i) => (
                      <div key={i} className={styles.hotkeyItem}>
                        <span className={styles.hotkeyDesc}>{h.desc}</span>
                        <kbd>{h.key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
