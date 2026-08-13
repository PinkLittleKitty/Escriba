export const headerHTML = `
    <div id="desktopBanner" class="desktop-banner" style="display: none;">
        <div class="banner-content">
            <i class="fas fa-desktop"></i>
            <span>Llevá Escriba a tu escritorio. Descargá la versión para PC.</span>
            <a href="https://github.com/PinkLittleKitty/Escriba/releases/tag/nightly" class="btn-banner"
                target="_blank">Descargar</a>
        </div>
        <button id="closeBanner" class="banner-close" aria-label="Cerrar banner">
            <i class="fas fa-times"></i>
        </button>
    </div>
    <header>
        <button id="mobileMenuToggle" class="mobile-menu-toggle" aria-label="Toggle menu">
            <i class="fas fa-bars"></i>
        </button>
        <div class="header-left">
            <button id="sidebarToggle" class="sidebar-toggle" title="Alternar modo compacto (Ctrl+\\)">
                <i class="fas fa-angles-left"></i>
            </button>
            <h1 id="logoHome" style="cursor: pointer; user-select: none;"><i class="fa-solid fa-book-open"></i>
                Escriba</h1>
            <div class="semester-info">
                <span id="currentSemester">1er Cuatrimestre</span>
            </div>
        </div>
        <div class="header-controls">
            <div class="github-controls">
                <div id="githubStatus" class="github-status">
                    <i class="fab fa-github"></i>
                    <span id="githubStatusText">No conectado</span>
                </div>
                <div class="sync-buttons" id="syncButtons" style="display: none;">
                    <button id="pullButton" class="btn btn-sync" title="Pull: Descargar cambios desde GitHub">
                        <i class="fas fa-download"></i>
                    </button>
                    <button id="pushButton" class="btn btn-sync" title="Push: Subir cambios a GitHub (forzado)">
                        <i class="fas fa-upload"></i>
                    </button>
                </div>
            </div>
            <button id="settingsBtn" class="btn btn-secondary" title="Ajustes de Escriba">
                <i class="fas fa-cog"></i> Ajustes
            </button>
            <input type="file" id="importFile" accept=".json" style="display: none;">
            <input type="file" id="importJsonFile" accept=".json" style="display: none;">
        </div>
    </header>
`;
