import { escapeHtml } from '../../utils/helpers.js';

export const detectDiagramType = (code) => {
    if (!code) return 'diagram';
    const lowerCode = code.toLowerCase();

    if (lowerCode.includes('classdiagram')) return 'class';
    if (lowerCode.includes('sequencediagram')) return 'sequence';
    if (lowerCode.includes('erdiagram')) return 'er';
    if (lowerCode.includes('statediagram')) return 'state';
    if (lowerCode.includes('gitgraph')) return 'git';
    if (lowerCode.includes('pie')) return 'pie';
    if (lowerCode.includes('journey')) return 'journey';
    if (lowerCode.includes('casos de uso') || lowerCode.includes('usecase') || lowerCode.includes('user((')) return 'usecase';
    if (lowerCode.includes('flowchart') || lowerCode.includes('graph')) return 'flowchart';

    return 'diagram';
};

export const getDiagramTypeName = (type) => {
    const names = {
        'class': 'de Clases',
        'sequence': 'de Secuencia',
        'flowchart': 'de Flujo',
        'er': 'Entidad-Relación',
        'state': 'de Estados',
        'usecase': 'de Casos de Uso',
        'git': 'Git',
        'pie': 'Circular',
        'journey': 'de Viaje del Usuario',
        'diagram': 'UML'
    };
    return names[type] || 'UML';
};

export const initUMLAceEditor = (containerId, onChangeCallback) => {
    if (typeof ace === 'undefined') return null;

    const container = document.getElementById(containerId);
    if (!container) return null;

    let editor = container.aceEditor;
    if (!editor) {
        editor = ace.edit(containerId);
        container.aceEditor = editor;
    }

    const appTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const aceTheme = appTheme === 'light' ? 'ace/theme/github' : 'ace/theme/tomorrow_night';

    editor.setTheme(aceTheme);
    editor.session.setMode('ace/mode/markdown');

    editor.setOptions({
        fontSize: 13.5,
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        showPrintMargin: false,
        wrap: true,
        useWorker: false,
        highlightActiveLine: true,
        showGutter: true,
        displayIndentGuides: true,
        tabSize: 4,
        useSoftTabs: true
    });

    if (onChangeCallback) {
        let changeTimeout;
        editor.session.off('change');
        editor.session.on('change', () => {
            clearTimeout(changeTimeout);
            changeTimeout = setTimeout(() => {
                onChangeCallback(editor.getValue());
            }, 250);
        });
    }

    setTimeout(() => {
        editor.resize(true);
    }, 100);

    return editor;
};

export const insertSnippetIntoAce = (editor, snippet) => {
    if (!editor) return;
    editor.insert(snippet);
    editor.focus();
};

export const syncUMLAceTheme = (editor) => {
    if (!editor) return;
    const appTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const aceTheme = appTheme === 'light' ? 'ace/theme/github' : 'ace/theme/tomorrow_night';
    editor.setTheme(aceTheme);
};

export const renderUMLDiagram = async (containerId, code) => {
    if (!containerId) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!code || !code.trim()) {
        container.innerHTML = `
            <div class="uml-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Código UML vacío</p>
            </div>
        `;
        return;
    }

    if (typeof mermaid !== 'undefined') {
        try {
            await mermaid.parse(code);
            const diagramId = 'uml-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const { svg } = await mermaid.render(diagramId, code);
            container.innerHTML = svg;
        } catch (error) {
            console.error('Error rendering UML diagram:', error);
            document.querySelectorAll('body > svg[id^="d"], body > .mermaid').forEach(el => el.remove());
            const errorMsg = error?.message || 'Verificá la sintaxis';
            container.innerHTML = `
                <div class="uml-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al renderizar el diagrama</p>
                    <small>${escapeHtml(errorMsg)}</small>
                </div>
            `;
        }
    } else {
        container.innerHTML = '<div class="uml-error">Mermaid no disponible</div>';
    }
};

export const updateUMLPreview = async (editorOrCode, previewContainer) => {
    if (!editorOrCode || !previewContainer) return;

    let code = '';
    if (typeof editorOrCode === 'string') {
        code = editorOrCode.trim();
    } else if (editorOrCode.getValue) {
        code = editorOrCode.getValue().trim();
    }

    if (!code) {
        previewContainer.innerHTML = '<div class="uml-preview-placeholder"><i class="fas fa-project-diagram"></i><p>Escribí código Mermaid o seleccioná una plantilla</p></div>';
        return;
    }

    previewContainer.innerHTML = '<div class="uml-preview-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Generando vista previa...</p></div>';

    try {
        if (typeof mermaid !== 'undefined') {
            await mermaid.parse(code);
            const diagramId = 'preview-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
            const { svg } = await mermaid.render(diagramId, code);
            previewContainer.innerHTML = svg;
        }
    } catch (error) {
        console.error('Mermaid preview error:', error);
        document.querySelectorAll('body > svg[id^="d"], body > .mermaid').forEach(el => el.remove());
        const errorMsg = error?.message || 'Verificá la sintaxis';
        previewContainer.innerHTML = `
            <div class="uml-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error en la vista previa</p>
                <small>${escapeHtml(errorMsg)}</small>
            </div>
        `;
    }
};
