export const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text.normalize('NFC');
};

export const cleanNoteContent = (content) => {
    if (!content || typeof content !== 'string') return content;

    let cleaned = content.normalize('NFC');
    cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

    return cleaned;
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return 'Hoy';
    } else if (diffDays === 2) {
        return 'Ayer';
    } else if (diffDays <= 7) {
        return `Hace ${diffDays - 1} día${diffDays - 1 !== 1 ? 's' : ''}`;
    } else {
        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
};

export const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

export const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return new Date(dateStr);
    return new Date(y, m - 1, d);
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const clearHighlights = (element) => {
    if (!element) return;
    const marks = element.querySelectorAll('mark.search-highlight');
    marks.forEach(mark => {
        const parent = mark.parentNode;
        const text = document.createTextNode(mark.textContent);
        parent.replaceChild(text, mark);
        parent.normalize();
    });
};

export const highlightElement = (element, query) => {
    if (!element || !query) {
        clearHighlights(element);
        return;
    }

    clearHighlights(element);

    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while (node = walk.nextNode()) {
        const parent = node.parentNode;
        if (parent.closest('.uml-diagram-container, .math-toolbar, .katex, .inline-ace-editor')) continue;
        nodes.push(node);
    }

    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');

    nodes.forEach(node => {
        const text = node.textContent;
        if (text.match(regex)) {
            const fragment = document.createDocumentFragment();
            let lastIdx = 0;
            text.replace(regex, (match, p1, offset) => {
                fragment.appendChild(document.createTextNode(text.substring(lastIdx, offset)));
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = match;
                fragment.appendChild(mark);
                lastIdx = offset + match.length;
                return match;
            });
            fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
            node.parentNode.replaceChild(fragment, node);
        }
    });
};
