export const sidebarHTML = `
    <aside id="sidebar" class="sidebar">
        <div class="mobile-grabber"></div>
        <div class="search-section">
            <div class="search-box-container">
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="Buscá en tu carpeta..." autocomplete="off">
                    <i class="fas fa-search"></i>
                </div>
                <div class="sidebar-header-actions">
                    <button id="sidebarNewSubjectBtn" class="sidebar-action-btn" title="Nueva Materia"
                        data-tooltip="Nueva Materia">
                        <i class="fas fa-folder-plus"></i>
                    </button>
                    <button id="sidebarNewNoteBtn" class="sidebar-action-btn" title="Nuevo Apunte"
                        data-tooltip="Nuevo Apunte">
                        <i class="fas fa-file-circle-plus"></i>
                    </button>
                </div>
            </div>
            <div class="view-toggles">
                <button class="view-btn active" data-view="subjects" title="Ver por materias"
                    data-tooltip="Materias">
                    <i class="fas fa-folder"></i><span class="view-btn-label">Materias</span>
                </button>
                <button class="view-btn" data-view="recent" title="Ver apuntes recientes"
                    data-tooltip="Recientes">
                    <i class="fas fa-clock"></i><span class="view-btn-label">Recientes</span>
                </button>
                <button class="view-btn" data-view="favorites" title="Ver apuntes favoritos"
                    data-tooltip="Favoritos">
                    <i class="fas fa-star"></i><span class="view-btn-label">Favoritos</span>
                </button>
                <button class="view-btn" data-view="calendar" title="Ver calendario de exámenes"
                    data-tooltip="Calendario">
                    <i class="fas fa-calendar-alt"></i><span class="view-btn-label">Calendario</span>
                </button>
            </div>
        </div>

        <div class="subjects-container" id="subjectsContainer">
            <!-- Las materias y apuntes se cargan acá -->
        </div>

        <div class="recent-container" id="recentContainer" style="display: none;">
            <div class="recent-notes-list">
                <!-- Los apuntes recientes se cargan acá -->
            </div>
        </div>

        <div class="favorites-container" id="favoritesContainer" style="display: none;">
            <div class="favorites-notes-list">
                <!-- Los apuntes favoritos se cargan acá -->
            </div>
        </div>

        <div class="calendar-container" id="calendarContainer" style="display: none;">
            <div class="calendar-section">
                <div class="calendar-header">
                    <button id="prevMonth" class="btn btn-icon">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h3 id="currentMonth"></h3>
                    <button id="nextMonth" class="btn btn-icon">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="calendar-grid" id="calendarGrid">
                    <!-- El calendario se genera acá -->
                </div>
            </div>
            <div class="calendar-events">
                <div class="events-header">
                    <h4><i class="fas fa-calendar-check"></i> Próximos Exámenes</h4>
                    <button id="addEventBtn" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
                <div id="eventsList" class="events-list">
                    <!-- Los eventos se cargan acá -->
                </div>
            </div>
        </div>

        <div class="archived-toggle-outer" style="display: none;">
            <button id="toggleArchivedBtn" class="btn-toggle-archived">
                <i class="fas fa-box-archive"></i>
                <span>Mostrar materias archivadas</span>
                <i class="fas fa-chevron-right toggle-icon"></i>
            </button>
        </div>
    </aside>
`;
