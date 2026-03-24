export const detectDiagramType = (code) => {
    const firstLine = code.split('\n')[0].trim().toLowerCase();

    if (firstLine.includes('classdiagram')) return 'class';
    if (firstLine.includes('sequencediagram')) return 'sequence';
    if (firstLine.includes('flowchart') || firstLine.includes('graph')) return 'flowchart';
    if (firstLine.includes('erdiagram')) return 'er';
    if (firstLine.includes('statediagram')) return 'state';
    if (firstLine.includes('gitgraph')) return 'git';
    if (firstLine.includes('pie')) return 'pie';
    if (firstLine.includes('journey')) return 'journey';

    return 'diagram';
};

export const getDiagramTypeName = (type) => {
    const names = {
        'class': 'de Clases',
        'sequence': 'de Secuencia',
        'flowchart': 'de Flujo',
        'er': 'Entidad-Relación',
        'state': 'de Estados',
        'git': 'Git',
        'pie': 'Circular',
        'journey': 'de Viaje del Usuario',
        'diagram': 'UML'
    };
    return names[type] || 'UML';
};

export const renderUMLDiagram = async (containerId, code) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (typeof mermaid !== 'undefined') {
        try {
            const diagramId = 'uml-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const { svg } = await mermaid.render(diagramId, code);
            container.innerHTML = svg;
        } catch (error) {
            console.error('Error rendering UML diagram:', error);
            container.innerHTML = `
                <div class="uml-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al renderizar el diagrama</p>
                    <small>${error.message || 'Verifica la sintaxis'}</small>
                </div>
            `;
        }
    } else {
        container.innerHTML = '<div class="uml-error">Mermaid no disponible</div>';
    }
};

export const updateUMLPreview = async (editor, previewContainer) => {
    if (!editor || !previewContainer) return;

    const code = editor.getValue().trim();
    if (!code) {
        previewContainer.innerHTML = '<div class="uml-preview-placeholder"><i class="fas fa-project-diagram"></i><p>Escribí código Mermaid</p></div>';
        return;
    }

    previewContainer.innerHTML = '<div class="uml-preview-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Generando vista previa...</p></div>';

    try {
        if (typeof mermaid !== 'undefined') {
            const diagramId = 'preview-' + Date.now();
            const { svg } = await mermaid.render(diagramId, code);
            previewContainer.innerHTML = svg;
        }
    } catch (error) {
        console.error('Mermaid preview error:', error);
    }
};
