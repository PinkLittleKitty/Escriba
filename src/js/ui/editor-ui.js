export const updateToolbarStates = () => {
    const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
    commands.forEach(command => {
        const btn = document.querySelector(`[data-command="${command}"]`);
        if (btn) {
            btn.classList.toggle('active', document.queryCommandState(command));
        }
    });

    const inlineCodeBtn = document.getElementById('inlineCodeBtn');
    if (inlineCodeBtn) {
        const selection = window.getSelection();
        let isInCodeElement = false;

        if (selection.rangeCount > 0) {
            let element = selection.getRangeAt(0).commonAncestorContainer;
            if (element.nodeType === Node.TEXT_NODE) {
                element = element.parentElement;
            }
            isInCodeElement = element.tagName === 'CODE' || element.closest('code');
        }

        inlineCodeBtn.classList.toggle('active', isInCodeElement);
    }

    const mathModeBtn = document.getElementById('mathModeBtn');
    if (mathModeBtn) {
        const noteTypeSelect = document.getElementById('noteTypeSelect');
        mathModeBtn.classList.toggle('active', noteTypeSelect && noteTypeSelect.value === 'math');
    }
};

export const updateLanguageSelectVisibility = (noteContent, languageSelect) => {
    if (!noteContent || !languageSelect) return;

    const hasCodeBlocks = noteContent.querySelectorAll('.inline-ace-editor').length > 0;
    languageSelect.style.display = hasCodeBlocks ? 'block' : 'none';
};

export const showWelcomeScreen = (show = true) => {
    const welcome = document.getElementById('welcomeScreen');
    const editor = document.getElementById('noteEditor');

    if (welcome && editor) {
        welcome.style.display = show ? 'flex' : 'none';
        editor.style.display = show ? 'none' : 'block';
    }
};
