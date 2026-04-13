export const initializeAceEditor = (editorContainer, initialCode = '', options = {}) => {
    if (!editorContainer || editorContainer.getAttribute('data-initialized') === 'true') {
        console.warn('Editor container already initialized or not found');
        return null;
    }

    try {
        editorContainer.setAttribute('data-initialized', 'initializing');

        if (editorContainer.aceEditor) {
            editorContainer.aceEditor.destroy();
            editorContainer.aceEditor = null;
        }

        editorContainer.innerHTML = '';
        editorContainer.style.height = '80px';
        editorContainer.style.minHeight = '80px';
        editorContainer.style.position = 'relative';

        const editor = ace.edit(editorContainer.id);

        editor.setTheme(options.theme || 'ace/theme/monokai');
        editor.session.setMode(options.mode || 'ace/mode/javascript');

        editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            showPrintMargin: false,
            wrap: true,
            useWorker: false,
            maxLines: 25,
            minLines: 3,
            autoScrollEditorIntoView: false,
            behavioursEnabled: true,
            highlightActiveLine: true,
            showGutter: true,
            displayIndentGuides: true,
            tabSize: 4,
            useSoftTabs: true,
            ...options.aceOptions
        });

        const code = initialCode || editorContainer.getAttribute('data-code') || '';
        if (code) {
            editor.setValue(code, -1);
        }

        editorContainer.aceEditor = editor;

        setupEditorEvents(editor, editorContainer, options);
        setupAutoResize(editor, editorContainer);

        setTimeout(() => {
            editor.resize(true);
            editorContainer.setAttribute('data-initialized', 'true');
            updateEditorHeight(editor, editorContainer);
        }, 100);

        return editor;

    } catch (error) {
        console.error('Error initializing Ace editor:', error);
        editorContainer.setAttribute('data-initialized', 'error');
        editorContainer.innerHTML = '<div class="editor-error">Error al cargar editor</div>';
        return null;
    }
};

const setupEditorEvents = (editor, editorContainer, options) => {
    editor.on('focus', () => {
        editorContainer.classList.add('ace-focused');
        if (options.onFocus) options.onFocus(editor);
    });

    editor.on('blur', () => {
        editorContainer.classList.remove('ace-focused');
        if (options.onBlur) options.onBlur(editor);
    });

    let changeTimeout;
    editor.session.on('change', () => {
        const currentCode = editor.getValue();
        editorContainer.setAttribute('data-code', currentCode);

        if (options.onChange) {
            clearTimeout(changeTimeout);
            changeTimeout = setTimeout(() => options.onChange(editor), 300);
        }
        updateEditorHeight(editor, editorContainer);
    });
};

const setupAutoResize = (editor, editorContainer) => {
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            if (editor.renderer) editor.resize(true);
        });
        resizeObserver.observe(editorContainer);
        editorContainer._resizeObserver = resizeObserver;
    }
};

export const updateEditorHeight = (editor, editorContainer) => {
    if (!editor || !editor.renderer || !editorContainer) return;

    try {
        const session = editor.getSession();
        if (!session) return;

        const lines = session.getLength();
        const lineHeight = editor.renderer.lineHeight || 18;
        const height = Math.max(lines * lineHeight, 60);

        editorContainer.style.height = height + 'px';
        editor.resize();
    } catch (e) {
        console.warn('Error updating editor height:', e);
    }
};
