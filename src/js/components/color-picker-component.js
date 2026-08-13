export const PRESET_COLORS = [
    { color: '#3b82f6', title: 'Azul' },
    { color: '#6366f1', title: 'Índigo' },
    { color: '#8b5cf6', title: 'Púrpura' },
    { color: '#a855f7', title: 'Violeta' },
    { color: '#d946ef', title: 'Fucsia' },
    { color: '#ec4899', title: 'Rosa' },
    { color: '#f43f5e', title: 'Carmín' },
    { color: '#ef4444', title: 'Rojo' },
    { color: '#f97316', title: 'Naranja' },
    { color: '#f59e0b', title: 'Ámbar' },
    { color: '#eab308', title: 'Amarillo' },
    { color: '#84cc16', title: 'Lima' },
    { color: '#10b981', title: 'Esmeralda' },
    { color: '#14b8a6', title: 'Turquesa' },
    { color: '#06b6d4', title: 'Cian' },
    { color: '#64748b', title: 'Pizarra' }
];

export function renderColorPickerHTML({
    containerId = 'colorPicker',
    containerClass = 'color-picker-grid',
    optionClass = 'color-option',
    customInputId = 'customColorPickerInput',
    includeThemeOptions = false,
    size = 'normal'
}) {
    const isSmall = size === 'small';
    const btnClass = isSmall ? 'custom-color-btn-small' : 'custom-color-btn';

    let optionsHTML = '';

    if (includeThemeOptions) {
        optionsHTML += `
            <button class="${optionClass}" data-color="var(--text-primary)" title="Texto Principal" style="background-color: var(--text-primary); border: 1px solid var(--border-color);"></button>
            <button class="${optionClass}" data-color="var(--text-secondary)" title="Texto Secundario" style="background-color: var(--text-secondary); border: 1px solid var(--border-color);"></button>
        `;
    }

    PRESET_COLORS.forEach((preset, index) => {
        const activeClass = (!includeThemeOptions && index === 0) ? ' active' : '';
        optionsHTML += `
            <button class="${optionClass}${activeClass}" data-color="${preset.color}" title="${preset.title}" style="background-color: ${preset.color};"></button>
        `;
    });

    optionsHTML += `
        <label class="${btnClass}" id="${customInputId}Wrapper" title="Color Personalizado">
            <input type="color" id="${customInputId}" value="#3b82f6">
            <i class="fas fa-eye-dropper"></i>
        </label>
    `;

    return `<div class="${containerClass}" id="${containerId}">${optionsHTML}</div>`;
}
