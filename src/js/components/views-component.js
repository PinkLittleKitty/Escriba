import { renderColorPickerHTML } from './color-picker-component.js';

export const viewsHTML = `
    <div id="mainViewContainer" class="main-view-container">
        <div id="dashboardScreen" class="dashboard-screen" style="display: none;"></div>

        <div id="welcomeScreen" class="welcome-screen" style="display: none;">
            <div class="welcome-bg-blob"></div>
            <div class="welcome-content">
                <div class="welcome-hero">
                    <div class="welcome-icon-wrapper">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <h1>¡Bienvenido a Escriba!</h1>
                    <p>Tu carpeta digital diseñada para organizar tus estudios con simplicidad y potencia.</p>
                </div>

                <div class="welcome-grid">
                    <div class="welcome-card">
                        <div class="card-icon"><i class="fas fa-folder"></i></div>
                        <h3>Organización Real</h3>
                        <p>Estructurá tus apuntes por materias, tal como en una carpeta física.</p>
                    </div>
                    <div class="welcome-card">
                        <div class="card-icon"><i class="fas fa-bolt"></i></div>
                        <h3>Búsqueda Veloz</h3>
                        <p>Encontrá cualquier concepto o palabra clave en segundos.</p>
                    </div>
                    <div class="welcome-card">
                        <div class="card-icon"><i class="fab fa-github"></i></div>
                        <h3>Nube y Sync</h3>
                        <p>Sincronizá con GitHub para tener tus apuntes seguros en todo lugar.</p>
                    </div>
                    <div class="welcome-card">
                        <div class="card-icon"><i class="fas fa-magic"></i></div>
                        <h3>Editor Inteligente</h3>
                        <p>LaTeX, diagramas UML y guardado automático constante.</p>
                    </div>
                </div>

                <div class="welcome-cta">
                    <button class="btn btn-primary btn-lg" id="welcomeNewSubject">
                        <i class="fas fa-plus"></i> Crear nueva materia
                    </button>
                </div>
            </div>
        </div>

        <div id="noteEditor" class="note-editor" style="display: none;">
            <div class="note-header">
                <div class="note-title-section">
                    <input type="text" id="noteTitle" placeholder="Apunte sin título" class="title-input"
                        autocomplete="off">
                    <div class="note-breadcrumb">
                        <span id="noteSubject"></span>
                    </div>
                </div>
                <div class="note-actions">
                    <select id="noteLanguageSelect" class="note-type-select"
                        title="Lenguaje para bloques de código" style="display: none;">
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                        <option value="markdown">Markdown</option>
                    </select>
                    <div class="note-meta">
                        <button id="favoriteBtn" class="btn btn-icon" title="Marcar como favorito">
                            <i class="fas fa-star"></i>
                        </button>
                        <button id="exportPdfBtn" class="btn btn-icon" title="Imprimir apunte">
                            <i class="fas fa-print"></i>
                        </button>
                        <button id="shareNoteBtn" class="btn btn-icon" title="Compartir apunte">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <span id="noteDate"></span>
                        <button id="deleteNoteBtn" class="btn btn-danger-subtle" title="Eliminar apunte">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="editor-toolbar">
                <div class="toolbar-group">
                    <button class="toolbar-btn" data-command="bold" title="Negrita (Ctrl+B)"><i
                            class="fas fa-bold"></i></button>
                    <button class="toolbar-btn" data-command="italic" title="Cursiva (Ctrl+I)"><i
                            class="fas fa-italic"></i></button>
                    <button class="toolbar-btn" data-command="underline" title="Subrayado (Ctrl+U)"><i
                            class="fas fa-underline"></i></button>
                    <button class="toolbar-btn" data-command="strikeThrough" title="Tachado"><i
                            class="fas fa-strikethrough"></i></button>
                    <button class="toolbar-btn" id="highlightBtn" title="Resaltar texto"><i
                            class="fas fa-highlighter"></i></button>
                    <button class="toolbar-btn" data-command="removeFormat" title="Limpiar formato"><i
                            class="fas fa-remove-format"></i></button>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <div class="toolbar-dropdown" id="fontSizeDropdown">
                        <button class="toolbar-btn" id="fontSizeToggleBtn" title="Tamaño de letra"><i
                                class="fas fa-text-height"></i></button>
                        <div class="dropdown-menu font-size-menu">
                            <button class="size-menu-option" data-size="1">Muy chico</button>
                            <button class="size-menu-option" data-size="2">Chico</button>
                            <button class="size-menu-option" data-size="3">Normal</button>
                            <button class="size-menu-option" data-size="4">Grande</button>
                            <button class="size-menu-option" data-size="5">Muy grande</button>
                            <button class="size-menu-option" data-size="6">Gigante</button>
                        </div>
                    </div>
                    <div class="toolbar-dropdown" id="textColorDropdown">
                        <button class="toolbar-btn" id="textColorToggleBtn" title="Color de texto">
                            <i class="fas fa-tint"></i>
                            <span class="color-dot" id="textColorIndicator"></span>
                        </button>
                        ${renderColorPickerHTML({
    containerId: 'textColorMenu',
    containerClass: 'dropdown-menu text-color-menu',
    optionClass: 'color-menu-option',
    customInputId: 'customTextColorPickerInput',
    includeThemeOptions: true,
    size: 'small'
})}
                    </div>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <button class="toolbar-btn" data-command="justifyLeft" title="Alinear a la izquierda"><i
                            class="fas fa-align-left"></i></button>
                    <button class="toolbar-btn" data-command="justifyCenter" title="Centrar (Ctrl+T)"><i
                            class="fas fa-align-center"></i></button>
                    <button class="toolbar-btn" data-command="justifyRight" title="Alinear a la derecha"><i
                            class="fas fa-align-right"></i></button>
                    <button class="toolbar-btn" data-command="justifyFull" title="Justificar"><i
                            class="fas fa-align-justify"></i></button>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <button class="toolbar-btn" data-command="insertUnorderedList" title="Lista con viñetas"><i
                            class="fas fa-list-ul"></i></button>
                    <button class="toolbar-btn" data-command="insertOrderedList" title="Lista numerada"><i
                            class="fas fa-list-ol"></i></button>
                    <button class="toolbar-btn" data-command="indent" title="Aumentar sangría (o usá Tab)"><i
                            class="fas fa-indent"></i></button>
                    <button class="toolbar-btn" data-command="outdent"
                        title="Reducir sangría (o usá Shift+Tab)"><i class="fas fa-outdent"></i></button>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <button class="toolbar-btn" id="insertLinkBtn" title="Enlazar apunte"><i
                            class="fas fa-link"></i></button>
                    <button class="toolbar-btn" id="insertTableBtn" title="Insertar tabla"><i
                            class="fas fa-table"></i></button>
                    <button class="toolbar-btn" id="insertHrBtn" title="Insertar línea horizontal"><i
                            class="fas fa-grip-lines"></i></button>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <button class="toolbar-btn" id="inlineCodeBtn" title="Código inline (Ctrl+\`)"><i
                            class="fas fa-code"></i></button>
                    <button class="toolbar-btn" id="insertCodeBtn" title="Insertar bloque de código"><i
                            class="fas fa-terminal"></i></button>
                    <button class="toolbar-btn" id="mathModeBtn" title="Modo matemático (Ctrl+M)"><i
                            class="fas fa-square-root-alt"></i></button>
                    <button class="toolbar-btn" id="insertUMLBtn" title="Insertar diagrama UML"><i
                            class="fas fa-project-diagram"></i></button>
                </div>
            </div>

            <div id="noteContent" class="note-content" contenteditable="true"
                placeholder="Empezá a escribir tus apuntes... Usá Tab para indentar, Ctrl+B para negrita, Ctrl+I para cursiva">
            </div>
            <div id="backlinksPanel" class="backlinks-panel" style="display: none;">
                <div class="backlinks-header">
                    <i class="fas fa-link"></i>
                    <span>Menciones a este apunte</span>
                </div>
                <div id="backlinksList" class="backlinks-list">
                </div>
            </div>
            <div class="editor-footer" id="editorFooter">
                <div class="stats-group">
                    <div class="stats-item">
                        <i class="fas fa-file-alt"></i>
                        <span id="wordCount">0 palabras</span>
                    </div>
                    <div class="stats-item">
                        <i class="fas fa-font"></i>
                        <span id="charCount">0 caracteres</span>
                    </div>
                    <div class="stats-item">
                        <i class="fas fa-clock"></i>
                        <span id="readingTime">0 min lectura</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
