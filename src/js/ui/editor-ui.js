export const updateToolbarStates = () => {
    const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
    commands.forEach(command => {
        const buttons = document.querySelectorAll(`[data-command="${command}"]`);
        buttons.forEach(btn => {
            btn.classList.toggle('active', document.queryCommandState(command));
        });
    });

    const selection = window.getSelection();
    let isInCodeElement = false;
    if (selection.rangeCount > 0) {
        let element = selection.getRangeAt(0).commonAncestorContainer;
        if (element.nodeType === Node.TEXT_NODE) element = element.parentElement;
        isInCodeElement = element.tagName === 'CODE' || element.closest('code');
    }

    let isHighlighted = false;
    if (selection.rangeCount > 0) {
        let element = selection.getRangeAt(0).commonAncestorContainer;
        if (element.nodeType === Node.TEXT_NODE) element = element.parentElement;
        isHighlighted = element.style.backgroundColor === 'rgb(255, 241, 118)' ||
            element.closest('[style*="background-color: rgb(255, 241, 118)"]') ||
            element.closest('mark');
    }

    const codeButtons = [document.getElementById('inlineCodeBtn'), document.getElementById('floatingCodeBtn')];
    codeButtons.forEach(btn => {
        if (btn) btn.classList.toggle('active', isInCodeElement);
    });

    const highlightButtons = [document.getElementById('highlightBtn'), document.getElementById('floatingHighlightBtn')];
    highlightButtons.forEach(btn => {
        if (btn) btn.classList.toggle('active', isHighlighted);
    });

    const mathModeBtn = document.getElementById('mathModeBtn');
    if (mathModeBtn) {
        const noteContent = document.getElementById('noteContent');
        mathModeBtn.classList.toggle('active', noteContent && noteContent.classList.contains('math-mode'));
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
