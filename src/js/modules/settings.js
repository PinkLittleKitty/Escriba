export const applySettings = () => {
    const settings = JSON.parse(localStorage.getItem('escribaSettings')) || {};

    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

    if (settings.fontFamily) {
        document.documentElement.style.setProperty('--font-family', settings.fontFamily);
    }

    if (settings.fontSize) {
        document.documentElement.style.setProperty('--font-size', settings.fontSize + 'px');
    }

    return settings;
};

export const loadSettingsToModal = (settings) => {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === (settings.theme || 'dark'));
    });

    const fontFamilyEl = document.getElementById('fontFamily');
    if (fontFamilyEl) fontFamilyEl.value = settings.fontFamily || 'Inter';

    const fontSizeEl = document.getElementById('fontSize');
    if (fontSizeEl) fontSizeEl.value = settings.fontSize || 16;

    const fontSizeValueEl = document.getElementById('fontSizeValue');
    if (fontSizeValueEl) fontSizeValueEl.textContent = (settings.fontSize || 16) + 'px';

    const autoSaveEl = document.getElementById('autoSave');
    if (autoSaveEl) autoSaveEl.checked = settings.autoSave !== false;

    const expandSubjectsEl = document.getElementById('expandSubjects');
    if (expandSubjectsEl) expandSubjectsEl.checked = settings.expandSubjects !== false;

    const showWelcomeEl = document.getElementById('showWelcome');
    if (showWelcomeEl) showWelcomeEl.checked = settings.showWelcome !== false;
};

export const getCurrentSettings = () => {
    return {
        theme: document.documentElement.getAttribute('data-theme') || 'dark',
        fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim().replace(/['"]/g, '') || 'Inter',
        fontSize: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--font-size')) || 16
    };
};
