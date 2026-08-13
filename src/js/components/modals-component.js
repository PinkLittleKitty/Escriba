import { renderColorPickerHTML } from './color-picker-component.js';

export const modalsHTML = `
    <div id="subjectModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="subjectModalTitle"><i class="fas fa-folder-plus"></i> Nueva Materia</h3>
                <button class="modal-close" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="subjectName">Nombre de la Materia</label>
                    <input type="text" id="subjectName" placeholder="ej: Análisis Matemático I" autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="subjectCode">Código / Sigla (opcional)</label>
                    <input type="text" id="subjectCode" placeholder="ej: AM1" autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="subjectProfessor">Profesor/a (opcional)</label>
                    <input type="text" id="subjectProfessor" placeholder="ej: Dr. García" autocomplete="off">
                </div>
                <div class="form-group">
                    <label>Color de la Materia</label>
                    ${renderColorPickerHTML({
    containerId: 'colorPicker',
    containerClass: 'color-picker',
    optionClass: 'color-option',
    customInputId: 'customColorPickerInput',
    includeThemeOptions: false,
    size: 'normal'
})}
                </div>

                <div class="form-group schedule-section">
                    <label><i class="fas fa-clock"></i> Horarios de Cursada (opcional)</label>
                    <div id="scheduleContainer" class="schedule-container">
                        <!-- Las filas de horario se agregan acá -->
                    </div>
                    <button type="button" id="addScheduleBtn" class="btn btn-secondary btn-sm" style="margin-top: 8px;">
                        <i class="fas fa-plus"></i> Agregar Horario
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelSubject">Cancelar</button>
                <button class="btn btn-primary" id="createSubject">Guardar Materia</button>
            </div>
        </div>
    </div>

    <div id="settingsModal" class="modal">
        <div class="modal-content modal-content-large">
            <div class="modal-header">
                <h3><i class="fas fa-cog"></i> Ajustes de Escriba</h3>
                <button class="modal-close" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body settings-layout">
                <aside class="settings-sidebar">
                    <button class="settings-tab-btn active" data-tab="tab-general">
                        <i class="fas fa-sliders-h"></i> General
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-apariencia">
                        <i class="fas fa-paint-brush"></i> Apariencia
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-sync">
                        <i class="fas fa-hard-drive"></i> Almacenamiento & Sync
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-datos">
                        <i class="fas fa-database"></i> Datos y Carpeta
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-ayuda">
                        <i class="fas fa-question-circle"></i> Ayuda / Acerca de
                    </button>
                </aside>

                <main class="settings-main">
                    <div class="settings-tab-panel active" id="tab-general">
                        <div class="settings-section">
                            <h4><i class="fas fa-floppy-disk"></i> Guardado y Comportamiento</h4>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="autoSave" checked>
                                    <span class="checkmark"></span>
                                    <span class="toggle-text">Guardado automático constante (cada vez que escribís)</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="expandSubjects" checked>
                                    <span class="checkmark"></span>
                                    <span class="toggle-text">Expandir materias por defecto en el panel lateral</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="showWelcome" checked>
                                    <span class="checkmark"></span>
                                    <span class="toggle-text">Mostrar pantalla de bienvenida al abrir sin apuntes</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="settings-tab-panel" id="tab-apariencia">
                        <div class="settings-section">
                            <h4><i class="fas fa-palette"></i> Tema Visual</h4>
                            <div class="theme-options">
                                <div class="theme-option active" data-theme="dark">
                                    <div class="theme-preview" style="background: #121212;">
                                        <div class="preview-header" style="background: #1e1e1e;">
                                            <div class="mock-dots"></div>
                                        </div>
                                        <div class="preview-body">
                                            <div class="preview-sidebar" style="background: #181818;">
                                                <div class="mock-item"></div>
                                                <div class="mock-item"></div>
                                            </div>
                                            <div class="preview-content" style="background: #121212;">
                                                <div class="mock-line-main"></div>
                                                <div class="mock-line-sub"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span>Oscuro</span>
                                </div>
                                <div class="theme-option" data-theme="light">
                                    <div class="theme-preview" style="background: #f8f9fa;">
                                        <div class="preview-header" style="background: #ffffff;">
                                            <div class="mock-dots"></div>
                                        </div>
                                        <div class="preview-body">
                                            <div class="preview-sidebar" style="background: #f1f3f5;">
                                                <div class="mock-item"></div>
                                                <div class="mock-item"></div>
                                            </div>
                                            <div class="preview-content" style="background: #ffffff;">
                                                <div class="mock-line-main" style="background: #212529;"></div>
                                                <div class="mock-line-sub"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span>Claro</span>
                                </div>
                                <div class="theme-option" data-theme="sakura">
                                    <div class="theme-preview" style="background: #faf4ed;">
                                        <div class="preview-header" style="background: #ffffff;">
                                            <div class="mock-dots"></div>
                                        </div>
                                        <div class="preview-body">
                                            <div class="preview-sidebar" style="background: #f2e9e1;">
                                                <div class="mock-item" style="background: #eb6f92;"></div>
                                                <div class="mock-item" style="background: #907aa9;"></div>
                                            </div>
                                            <div class="preview-content" style="background: #faf4ed;">
                                                <div class="mock-line-main" style="background: #575279;"></div>
                                                <div class="mock-line-sub"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span>Sakura</span>
                                </div>
                                <div class="theme-option" data-theme="github">
                                    <div class="theme-preview" style="background: #0d1117;">
                                        <div class="preview-header" style="background: #161b22;">
                                            <div class="mock-dots"></div>
                                        </div>
                                        <div class="preview-body">
                                            <div class="preview-sidebar" style="background: #161b22;">
                                                <div class="mock-item" style="background: #2f81f7;"></div>
                                                <div class="mock-item" style="background: #2f81f7;"></div>
                                            </div>
                                            <div class="preview-content" style="background: #0d1117;">
                                                <div class="mock-line-main" style="background: #e6edf3;"></div>
                                                <div class="mock-line-sub"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span>GitHub</span>
                                </div>
                                <div class="theme-option" data-theme="catppuccin">
                                    <div class="theme-preview" style="background: #1e1e2e;">
                                        <div class="preview-header" style="background: #181825;">
                                            <div class="mock-dots"></div>
                                        </div>
                                        <div class="preview-body">
                                            <div class="preview-sidebar" style="background: #181825;">
                                                <div class="mock-item" style="background: #cba6f7;"></div>
                                                <div class="mock-item" style="background: #89b4fa;"></div>
                                            </div>
                                            <div class="preview-content" style="background: #1e1e2e;">
                                                <div class="mock-line-main" style="background: #cdd6f4;"></div>
                                                <div class="mock-line-sub"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span>Catppuccin</span>
                                </div>
                                <div class="theme-option" data-theme="blue">
                                    <div class="theme-preview" style="background: #0f172a;">
                                        <div class="preview-header" style="background: #1e293b;">
                                            <div class="mock-dots"></div>
                                        </div>
                                        <div class="preview-body">
                                            <div class="preview-sidebar" style="background: #131d31;">
                                                <div class="mock-item" style="background: #38bdf8;"></div>
                                                <div class="mock-item" style="background: #38bdf8;"></div>
                                            </div>
                                            <div class="preview-content" style="background: #0f172a;">
                                                <div class="mock-line-main"></div>
                                                <div class="mock-line-sub"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span>Azul</span>
                                </div>
                                <div class="theme-option" data-theme="matcha">
                                    <div class="theme-preview" style="background: #151e18;">
                                        <div class="preview-header" style="background: #1d2a22;">
                                            <div class="mock-dots"></div>
                                        </div>
                                        <div class="preview-body">
                                            <div class="preview-sidebar" style="background: #1d2a22;">
                                                <div class="mock-item" style="background: #52b788;"></div>
                                                <div class="mock-item" style="background: #52b788;"></div>
                                            </div>
                                            <div class="preview-content" style="background: #151e18;">
                                                <div class="mock-line-main" style="background: #e8f5e9;"></div>
                                                <div class="mock-line-sub"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span>Matcha</span>
                                </div>
                                <div class="theme-option" data-theme="unq">
                                    <div class="theme-preview" style="background: #0a0a0a;">
                                        <div class="preview-header" style="background: #141414;">
                                            <div class="mock-dots"></div>
                                        </div>
                                        <div class="preview-body">
                                            <div class="preview-sidebar" style="background: #0f0f0f;">
                                                <div class="mock-item" style="background: #990000;"></div>
                                                <div class="mock-item" style="background: #990000;"></div>
                                            </div>
                                            <div class="preview-content" style="background: #0a0a0a;">
                                                <div class="mock-line-main" style="background: #e5e5e5;"></div>
                                                <div class="mock-line-sub"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span>UNQ</span>
                                </div>
                                <div class="theme-option" data-theme="sunset">
                                    <div class="theme-preview" style="background: #1c0f13;">
                                        <div class="preview-header" style="background: #2b171d;">
                                            <div class="mock-dots"></div>
                                        </div>
                                        <div class="preview-body">
                                            <div class="preview-sidebar" style="background: #231218;">
                                                <div class="mock-item" style="background: #ff758f;"></div>
                                                <div class="mock-item" style="background: #ff758f;"></div>
                                            </div>
                                            <div class="preview-content" style="background: #1c0f13;">
                                                <div class="mock-line-main"></div>
                                                <div class="mock-line-sub"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span>Atardecer</span>
                                </div> </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h4><i class="fas fa-font"></i> Tipografía y Tamaño</h4>
                            <div class="form-group">
                                <label for="fontFamily">Fuente Principal</label>
                                <select id="fontFamily" class="settings-select">
                                    <option value="Inter, sans-serif">Inter (Predeterminada, Modema)</option>
                                    <option value="'Roboto', sans-serif">Roboto (Limpia, Lectura fácil)</option>
                                    <option value="'Outfit', sans-serif">Outfit (Geométrica, Estilizada)</option>
                                    <option value="'JetBrains Mono', monospace">JetBrains Mono (Programador)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="fontSize">Tamaño de Texto en Editor (<span
                                        id="fontSizeValue">16px</span>)</label>
                                <div class="slider-group">
                                    <input type="range" id="fontSize" min="12" max="24" value="16"
                                        class="settings-slider">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-tab-panel" id="tab-sync">
                        <div class="settings-section">
                            <h4><i class="fas fa-hard-drive"></i> Modo de Almacenamiento</h4>
                            <p class="settings-help-text" style="margin-bottom: 12px; font-size: 0.9em; opacity: 0.8;">
                                Elegí dónde querés guardar y respaldar tus apuntes.</p>
                            <div class="storage-mode-selector">
                                <label class="storage-option-card active" id="modeGithubCard">
                                    <input type="radio" name="storageMode" value="github" id="storageModeGithub"
                                        checked>
                                    <div class="storage-card-content">
                                        <div class="storage-card-icon"><i class="fab fa-github"></i></div>
                                        <div class="storage-card-info">
                                            <strong>GitHub</strong>
                                            <span>Sincronizá tus apuntes entre distintos dispositivos con GitHub.</span>
                                        </div>
                                    </div>
                                </label>
                                <label class="storage-option-card" id="modeLocalCard">
                                    <input type="radio" name="storageMode" value="local" id="storageModeLocal">
                                    <div class="storage-card-content">
                                        <div class="storage-card-icon"><i class="fas fa-desktop"></i></div>
                                        <div class="storage-card-info">
                                            <strong>Disco Local (Offline)</strong>
                                            <span>Guardá tus apuntes en la carpeta de tu equipo</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="settings-section" id="githubSyncSection">
                            <h4><i class="fab fa-github"></i> Sincronización GitHub</h4>
                            <div class="sync-settings">
                                <div class="form-group">
                                    <div class="sync-info-box" id="syncInfo">
                                        <div class="sync-status-display">
                                            <span id="settingsSyncStatus">No conectado</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="autoSync" checked>
                                        <span class="checkmark"></span>
                                        <span class="toggle-text">Sincronización automática</span>
                                    </label>
                                </div>
                                <div class="sync-actions-group">
                                    <button class="btn btn-primary" id="settingsSyncButton">
                                        <i class="fab fa-github"></i> Conectar GitHub
                                    </button>
                                    <button class="btn btn-danger-link" id="disconnectGitHub" style="display: none;">
                                        <i class="fas fa-unlink"></i> Desconectar Cuenta
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section" id="localStorageSection" style="display: none;">
                            <h4><i class="fas fa-folder-open"></i> Configuración de Carpeta Local</h4>
                            <div class="local-storage-settings">
                                <div class="form-group">
                                    <label style="font-weight: 500; font-size: 0.9em;">Carpeta local donde se guardan
                                        tus apuntes:</label>
                                    <div class="local-path-display-box"
                                        style="margin-top: 6px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                                        <code id="localFolderPathDisplay"
                                            style="word-break: break-all; font-family: monospace;">C:\\Users\\...</code>
                                    </div>
                                </div>
                                <div class="sync-actions-group"
                                    style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
                                    <button class="btn btn-secondary" id="selectLocalFolderBtn"
                                        title="Cambiar la carpeta en donde se guardan los archivos">
                                        <i class="fas fa-folder-plus"></i> Seleccionar Carpeta...
                                    </button>
                                    <button class="btn btn-secondary" id="openLocalFolderBtn"
                                        title="Abrir la carpeta local en el explorador de archivos">
                                        <i class="fas fa-external-link-alt"></i> Abrir Carpeta
                                    </button>
                                    <button class="btn btn-ghost" id="resetLocalFolderBtn"
                                        title="Volver a la carpeta predeterminada (%appdata% / ~/.config)">
                                        <i class="fas fa-undo"></i> Restablecer
                                    </button>
                                </div>
                                <div class="cloud-actions-grid" style="margin-top: 16px;">
                                    <button class="btn btn-secondary" id="saveLocalNowBtn">
                                        <i class="fas fa-save"></i> Guardar Ahora
                                    </button>
                                    <button class="btn btn-secondary" id="loadLocalNowBtn">
                                        <i class="fas fa-file-import"></i> Recargar desde Disco
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section" id="cloudActionsArea" style="display:none;">
                            <h4><i class="fas fa-cloud"></i> Acciones Directas</h4>
                            <div class="cloud-actions-grid">
                                <button class="btn btn-secondary" id="settingsPullBtn">
                                    <i class="fas fa-download"></i> Descargar (Pull)
                                </button>
                                <button class="btn btn-secondary" id="settingsPushBtn">
                                    <i class="fas fa-upload"></i> Subir (Push Forzado)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="settings-tab-panel" id="tab-datos">
                        <div class="settings-section">
                            <h4><i class="fas fa-database"></i> Estadísticas de Carpeta</h4>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon"><i class="fas fa-folder"></i></div>
                                    <div class="stat-info">
                                        <span class="stat-value" id="countSubjects">0</span>
                                        <span class="stat-label">Materias</span>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon"><i class="fas fa-sticky-note"></i></div>
                                    <div class="stat-info">
                                        <span class="stat-value" id="countNotes">0</span>
                                        <span class="stat-label">Apuntes</span>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
                                    <div class="stat-info">
                                        <span class="stat-value" id="countWords">0</span>
                                        <span class="stat-label">Palabras</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="settings-section">
                            <h4><i class="fas fa-file-export"></i> Gestión de Carpeta</h4>
                            <div class="utility-actions-group">
                                <button class="btn btn-secondary" id="exportBtn">
                                    <i class="fas fa-download"></i> Exportar Todo (.json)
                                </button>
                                <button class="btn btn-secondary" id="importBtn">
                                    <i class="fas fa-upload"></i> Importar Carpeta
                                </button>
                                <button class="btn btn-secondary" id="importJsonBtn">
                                    <i class="fas fa-file-import"></i> Cargar Apunte JSON
                                </button>
                                <button class="btn btn-secondary" id="deduplicateNotesBtn"
                                    title="Buscar y eliminar notas duplicadas en la misma materia">
                                    <i class="fas fa-broom"></i> Eliminar Duplicados
                                </button>
                            </div>
                        </div>
                        <div class="settings-section">
                            <h4><i class="fas fa-tools"></i> Mantenimiento</h4>
                            <div class="settings-actions-group">
                                <button class="btn-ghost" id="resetSettings">
                                    <i class="fas fa-undo"></i> Restablecer Configuración
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="settings-tab-panel" id="tab-ayuda">
                        <div class="settings-about">
                            <div class="about-logo">
                                <div class="about-icon-badge">
                                    <i class="fa-solid fa-book-open"></i>
                                </div>
                                <h2>Escriba</h2>
                                <p>Tu carpeta digital de estudio</p>
                            </div>
                            <div class="about-info">
                                <div class="about-item">
                                    <span class="about-label">Build</span>
                                    <span class="about-value" id="appBuildDisplay">nightly</span>
                                </div>
                                <div class="about-item">
                                    <span class="about-label">Desarrollado por</span>
                                    <span class="about-value">JustNeki</span>
                                </div>
                                <div class="about-item">
                                    <span class="about-label">Código Fuente</span>
                                    <a href="https://github.com/PinkLittleKitty/Escriba" target="_blank"
                                        class="about-link">
                                        GitHub <i class="fas fa-external-link-alt"></i>
                                    </a>
                                </div>
                            </div>

                            <div class="settings-section hotkeys-section">
                                <h4><i class="fas fa-keyboard"></i> Atajos de Teclado</h4>
                                <div class="hotkeys-grid">
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Nuevo Apunte</span>
                                        <kbd>Ctrl + N</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Guardar</span>
                                        <kbd>Ctrl + S</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Buscar</span>
                                        <kbd>Ctrl + F</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Modo Matemático</span>
                                        <kbd>Ctrl + M</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Modo Compacto</span>
                                        <kbd>Ctrl + \\</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Centrar Texto</span>
                                        <kbd>Ctrl + T</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Deshacer</span>
                                        <kbd>Ctrl + Z</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Rehacer</span>
                                        <kbd>Ctrl + Y / ⇧Z</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Sangría (Tab)</span>
                                        <kbd>Tab</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Quitar sangría</span>
                                        <kbd>Shift + Tab</kbd>
                                    </div>
                                    <div class="hotkey-item">
                                        <span class="hotkey-desc">Consola Dev</span>
                                        <kbd>Ctrl + Alt + D</kbd>
                                    </div>
                                </div>
                            </div>

                            <div class="settings-footer-vip section-no-border">
                                <button class="btn-danger-minimal" id="clearAllData">
                                    <i class="fas fa-trash-alt"></i> Borrar Todo el Contenido
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelSettings">Cancelar</button>
                <button class="btn btn-primary" id="saveSettings">Guardar Cambios</button>
            </div>
        </div>
    </div>

    <div id="subjectPickerModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-file-circle-plus"></i> Crear Nuevo Apunte</h3>
                <button class="modal-close" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Seleccioná la materia para el nuevo apunte:</label>
                    <div id="subjectPickerList" class="subject-picker-list">
                        <!-- Las materias se cargan acá -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelSubjectPicker">Cancelar</button>
            </div>
        </div>
    </div>

    <div id="linkModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-link"></i> Enlazar Apunte</h3>
                <button class="modal-close" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="linkText">Texto del enlace</label>
                    <input type="text" id="linkText" placeholder="ej: como vimos la semana pasada" autocomplete="off">
                </div>
                <div class="form-group">
                    <label>Buscar apunte para enlazar:</label>
                    <div class="search-box">
                        <input type="text" id="linkSearchInput" placeholder="Buscar por título o materia..."
                            autocomplete="off">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label>Seleccionar apunte:</label>
                    <div id="linkNotesList" class="link-notes-list">
                        <!-- Los apuntes se cargan acá -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelLink">Cancelar</button>
                <button class="btn btn-primary" id="createLink" disabled>Crear Enlace</button>
            </div>
        </div>
    </div>

    <div id="tableModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-table"></i> Insertar Tabla</h3>
                <button class="modal-close" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="tableRows">Número de filas</label>
                    <input type="number" id="tableRows" min="1" max="100" value="3" autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="tableCols">Número de columnas</label>
                    <input type="number" id="tableCols" min="1" max="100" value="3" autocomplete="off">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelTable">Cancelar</button>
                <button class="btn btn-primary" id="insertTableSubmit">Insertar Tabla</button>
            </div>
        </div>
    </div>

    <div id="eventModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-calendar-plus"></i> <span id="eventModalTitle">Agregar Examen</span>
                </h3>
                <button class="modal-close" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="eventTitle">Título del Examen</label>
                    <input type="text" id="eventTitle" placeholder="ej: Parcial de Análisis Matemático"
                        autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="eventSubject">Materia</label>
                    <select id="eventSubject" class="settings-select">
                        <option value="">Seleccionar materia...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="eventDate">Fecha</label>
                    <input type="date" id="eventDate" class="date-input">
                </div>
                <div class="form-group">
                    <label for="eventTime">Hora (opcional)</label>
                    <input type="time" id="eventTime" class="time-input">
                </div>
                <div class="form-group">
                    <label for="eventType">Tipo de Examen</label>
                    <select id="eventType" class="settings-select">
                        <option value="parcial"><i class="fas fa-chart-bar"></i> Parcial</option>
                        <option value="final"><i class="fas fa-bullseye"></i> Final</option>
                        <option value="tp"><i class="fas fa-tasks"></i> Trabajo Práctico</option>
                        <option value="entrega"><i class="fas fa-paper-plane"></i> Entrega</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="eventNotes">Notas (opcional)</label>
                    <textarea id="eventNotes" placeholder="Temas a estudiar, aula, etc." rows="3"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelEvent">Cancelar</button>
                <button class="btn btn-danger" id="deleteEvent" style="display: none;">Eliminar</button>
                <button class="btn btn-primary" id="saveEvent">Guardar</button>
            </div>
        </div>
    </div>

    <div id="umlModal" class="modal">
        <div class="modal-content modal-large uml-modal-content">
            <div class="modal-header uml-modal-header">
                <div class="uml-header-left">
                    <button class="btn btn-sm btn-icon btn-secondary" id="umlToggleSidebarBtn" title="Plantillas">
                        <i class="fas fa-layer-group"></i>
                    </button>
                    <h3><i class="fas fa-project-diagram"></i> Diagrama UML</h3>
                </div>
                <div class="uml-header-actions">
                    <button class="modal-close" title="Cerrar">&times;</button>
                </div>
            </div>
            <div class="modal-body uml-modal-body">
                <div class="uml-editor-container" id="umlEditorContainer">
                    <div class="uml-sidebar collapsed" id="umlSidebar">
                        <div class="uml-sidebar-header">
                            <h4><i class="fas fa-shapes"></i> Plantillas</h4>
                        </div>
                        <div class="uml-templates">
                            <button class="uml-template-btn active" data-template="class"
                                title="Diagrama de Clases (POO, estructuras y atributos)">
                                <i class="fas fa-cube"></i>
                                <span>Clases</span>
                            </button>
                            <button class="uml-template-btn" data-template="sequence"
                                title="Diagrama de Secuencia (Interacciones y llamadas en tiempo)">
                                <i class="fas fa-arrows-alt-h"></i>
                                <span>Secuencia</span>
                            </button>
                            <button class="uml-template-btn" data-template="flowchart"
                                title="Diagrama de Flujo (Algoritmos y decisiones)">
                                <i class="fas fa-sitemap"></i>
                                <span>Flujo</span>
                            </button>
                            <button class="uml-template-btn" data-template="er"
                                title="Diagrama Entidad-Relación (Bases de Datos)">
                                <i class="fas fa-database"></i>
                                <span>Entidad-Relación</span>
                            </button>
                            <button class="uml-template-btn" data-template="state"
                                title="Diagrama de Estados (Transiciones de sistema)">
                                <i class="fas fa-circle-notch"></i>
                                <span>Estados</span>
                            </button>
                            <button class="uml-template-btn" data-template="usecase"
                                title="Casos de Uso (Actores e interacciones de usuario)">
                                <i class="fas fa-user-circle"></i>
                                <span>Casos de Uso</span>
                            </button>
                            <button class="uml-template-btn" data-template="git"
                                title="Git Graph (Ramificación y commits)">
                                <i class="fab fa-git-alt"></i>
                                <span>Git Graph</span>
                            </button>
                            <button class="uml-template-btn" data-template="pie"
                                title="Gráfico Circular (Estadísticas y proporciones)">
                                <i class="fas fa-chart-pie"></i>
                                <span>Circular</span>
                            </button>
                            <button class="uml-template-btn" data-template="journey"
                                title="User Journey (Experiencia del usuario)">
                                <i class="fas fa-route"></i>
                                <span>User Journey</span>
                            </button>
                        </div>
                    </div>

                    <div class="uml-main">
                        <div class="uml-editor-section">
                            <div class="uml-editor-header">
                                <h4><i class="fas fa-code"></i> Editor</h4>
                            </div>
                            <div class="uml-ace-container" id="umlAceContainer">
                                <div id="umlAceEditor" class="uml-ace-editor"></div>
                            </div>
                        </div>

                        <div class="uml-preview-section">
                            <div class="uml-preview-header">
                                <h4><i class="fas fa-eye"></i> Vista Previa</h4>
                                <div class="uml-preview-actions">
                                    <button class="btn btn-sm btn-secondary" id="umlZoomInBtn" title="Aumentar zoom">
                                        <i class="fas fa-search-plus"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" id="umlZoomOutBtn" title="Disminuir zoom">
                                        <i class="fas fa-search-minus"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" id="umlResetZoomBtn"
                                        title="Restablecer zoom">
                                        <i class="fas fa-redo"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="uml-preview-container">
                                <div class="uml-preview" id="umlPreview">
                                    <div class="uml-preview-placeholder">
                                        <i class="fas fa-project-diagram"></i>
                                        <p>La vista previa aparecerá aquí</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelUML">Cancelar</button>
                <button class="btn btn-primary" id="insertUMLDiagram">Insertar Diagrama</button>
            </div>
        </div>
    </div>

    <div id="shareModal" class="modal">
        <div class="modal-content share-modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-share-alt"></i> Compartir Apunte</h3>
                <button class="modal-close" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body share-modal-body">

                <div class="share-github-banner" id="githubSyncShareInfo" style="display: none;">
                    <div class="share-github-left">
                        <i class="fab fa-github"></i>
                        <div>
                            <span class="share-github-title">Repositorio conectado</span>
                            <span class="share-github-repo" id="githubRepoPath">username/escriba-notes</span>
                        </div>
                    </div>
                    <div class="share-github-right">
                        <span class="share-privacy-status" id="repoPrivacyStatus">Verificando...</span>
                        <button class="btn btn-secondary btn-sm"
                            onclick="window.open('https://github.com/' + document.getElementById('githubRepoPath').textContent, '_blank')">
                            <i class="fas fa-external-link-alt"></i> Ver
                        </button>
                    </div>
                </div>

                <div id="githubWarning" class="share-warning" style="display: none;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong id="warningTitle">Repositorio Público Requerido</strong>
                        <p id="warningMessage">Para que los enlaces funcionen, tu repositorio debe ser
                            <strong>público</strong>.
                        </p>
                    </div>
                </div>

                <div class="share-main">
                    <div class="share-left">
                        <div class="share-card">
                            <div class="share-card-header">
                                <i class="fas fa-link"></i>
                                <span>Enlace para compartir</span>
                            </div>
                            <p class="share-description">Cualquiera con este enlace puede verlo en modo solo
                                lectura.</p>
                            <div class="share-method-badge" id="shareMethodInfo">
                                <i class="fas fa-spinner fa-spin"></i> Generando enlace...
                            </div>
                            <div class="share-url-row">
                                <input type="text" id="shareUrl" class="share-url-input" readonly
                                    placeholder="Generando enlace...">
                                <button id="copyUrlBtn" class="btn btn-primary share-copy-btn" title="Copiar enlace">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>

                        <div class="share-card">
                            <div class="share-card-header">
                                <i class="fas fa-share"></i>
                                <span>Compartir</span>
                            </div>
                            <div class="share-actions-row">
                                <button id="shareWhatsApp" class="share-action-btn whatsapp">
                                    <i class="fab fa-whatsapp"></i> WhatsApp
                                </button>
                                <button id="shareEmail" class="share-action-btn email">
                                    <i class="fas fa-envelope"></i> Email
                                </button>
                                <button id="exportJsonBtn" class="share-action-btn export">
                                    <i class="fas fa-download"></i> JSON
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="share-qr-panel">
                        <div class="share-card-header">
                            <i class="fas fa-qrcode"></i>
                            <span>Código QR</span>
                        </div>
                        <canvas id="qrCanvas" width="180" height="180"></canvas>
                        <p class="qr-hint">Escaneá con la cámara de tu teléfono</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelShare">Cerrar</button>
            </div>
        </div>
    </div>

    <nav class="mobile-bottom-nav">
        <button class="mobile-nav-btn active" data-view="dashboard" id="mobileNavDashboard">
            <i class="fas fa-home"></i>
            <span>Inicio</span>
        </button>
        <button class="mobile-nav-btn" data-view="calendar" id="mobileNavCalendar">
            <i class="fas fa-calendar-alt"></i>
            <span>Agenda</span>
        </button>
        <button class="mobile-nav-btn" data-view="notes" id="mobileNavNotes">
            <i class="fas fa-folder"></i>
            <span>Carpeta</span>
        </button>
        <button class="mobile-nav-btn" data-view="settings" id="mobileNavSettings">
            <i class="fas fa-cog"></i>
            <span>Ajustes</span>
        </button>
    </nav>

    <div id="githubTokenModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fab fa-github"></i> Conectar con GitHub</h3>
                <button class="modal-close" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body">
                <div class="token-auth-steps">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <p>Generá un <strong>Personal Access Token (Classic)</strong> en tu cuenta de
                                GitHub.
                            </p>
                            <a href="https://github.com/settings/tokens/new?scopes=gist,repo&description=Escriba%20App"
                                target="_blank" class="help-link">
                                <i class="fas fa-external-link-alt"></i> Crear token ahora
                            </a>
                        </div>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <p>Asegurate de seleccionar los permisos <strong>'gist'</strong> y
                                <strong>'repo'</strong>.
                            </p>
                        </div>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <p>Pegá el token generado a continuación:</p>
                            <div class="token-input-group">
                                <input type="password" id="githubTokenInput" class="token-input"
                                    placeholder="ghp_xxxxxxxxxxxx" autocomplete="one-time-code" spellcheck="false">
                            </div>
                            <span class="help-text">Tu token se guarda de forma segura en este
                                navegador.</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelToken">Cancelar</button>
                <button class="btn btn-primary" id="confirmToken">Conectar GitHub</button>
            </div>
        </div>
    </div>

    <div id="graphModal" class="modal modal-full">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-network-wired"></i> Minimapa</h3>
                <div class="header-actions" style="margin-left: auto; display: flex; gap: 10px; align-items: center;">
                    <button class="modal-close" title="Cerrar">&times;</button>
                </div>
            </div>
            <div class="modal-body graph-container" id="graphContainer">
                <svg id="graphSvg" width="100%" height="100%">
                    <g id="graphViewport">
                        <g id="graphEdges"></g>
                        <g id="graphNodes"></g>
                    </g>
                </svg>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="closeGraph">Cerrar</button>
            </div>
        </div>
    </div>

    <div id="updateModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-rocket"></i> ¡Nueva Versión!</h3>
                <button class="modal-close" onclick="hideModal('updateModal')" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body">
                <div class="update-info">
                    <p>Hay una nueva actualización disponible en el canal <strong>nightly</strong>.</p>
                    <p id="updateDateInfo" class="update-date"
                        style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;"></p>
                    <div id="updateReleaseNotes" class="release-notes-container">
                        <!-- Descripcíon de la versión -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="hideModal('updateModal')">Recordar después</button>
                <a id="updateDownloadLink" href="https://github.com/PinkLittleKitty/Escriba/releases/tag/nightly"
                    target="_blank" class="btn btn-primary">
                    <i class="fas fa-download"></i> Descargar v. Nightly
                </a>
            </div>
        </div>
    </div>

    <div id="confirmModal" class="modal">
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">
                <h3 id="confirmModalTitle"><i id="confirmModalIcon" class="fas fa-exclamation-triangle"></i> Confirmar
                    acción</h3>
                <button class="modal-close" id="confirmModalClose" title="Cerrar">&times;</button>
            </div>
            <div class="modal-body">
                <p id="confirmModalMessage"
                    style="color: var(--text-primary); font-size: 1rem; line-height: 1.5; white-space: pre-wrap;"></p>
            </div>
            <div class="modal-footer">
                <button id="confirmModalCancel" class="btn btn-secondary">Cancelar</button>
                <button id="confirmModalOk" class="btn btn-danger">Confirmar</button>
            </div>
        </div>
    </div>

    <div id="toast" class="toast">
        <div class="toast-content">
            <i class="toast-icon"></i>
            <div class="toast-text-area">
                <span class="toast-message"></span>
                <span class="toast-subtext" style="display: none;"></span>
            </div>
        </div>
        <div class="toast-progress-container" style="display: none;">
            <div class="toast-progress-bar"></div>
        </div>
    </div>

    <div id="printFolderContainer"></div>
`;
