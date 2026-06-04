let toastTimeoutId = null;

export const showToast = (message, type = 'success', options = {}) => {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    const subtextEl = toast.querySelector('.toast-subtext');
    const progressContainer = toast.querySelector('.toast-progress-container');
    const progressBar = toast.querySelector('.toast-progress-bar');

    if (messageEl) messageEl.textContent = message;
    toast.className = `toast ${type}`;

    if (icon) {
        if (type === 'success') {
            icon.className = 'toast-icon fas fa-check-circle';
        } else if (type === 'error') {
            icon.className = 'toast-icon fas fa-exclamation-circle';
        } else if (type === 'info') {
            icon.className = 'toast-icon fas fa-info-circle';
        } else if (type === 'syncing') {
            icon.className = 'toast-icon fas fa-sync fa-spin';
            toast.className = 'toast info';
        }
    }

    if (options.subtext) {
        subtextEl.textContent = options.subtext;
        subtextEl.style.display = 'block';
    } else if (subtextEl) {
        subtextEl.style.display = 'none';
    }

    if (options.progress !== undefined) {
        progressContainer.style.display = 'block';
        progressBar.style.width = `${Math.min(100, Math.max(0, options.progress))}%`;
    } else if (progressContainer) {
        progressContainer.style.display = 'none';
    }

    toast.classList.add('show');

    if (toast._clickListener) {
        toast.removeEventListener('click', toast._clickListener);
        toast._clickListener = null;
    }

    if (type === 'error' || options.onClick) {
        toast.style.cursor = 'pointer';
        toast._clickListener = (e) => {
            if (options.onClick) {
                options.onClick(e);
            } else if (type === 'error') {
                if (window.cuaderno && window.cuaderno.consoleUI) {
                    window.cuaderno.consoleUI.toggle(true);
                }
                toast.classList.remove('show');
            }
        };
        toast.addEventListener('click', toast._clickListener);
    } else {
        toast.style.cursor = '';
    }

    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
        toastTimeoutId = null;
    }

    const duration = options.duration !== undefined ? options.duration : 3000;
    if (duration > 0) {
        toastTimeoutId = setTimeout(() => toast.classList.remove('show'), duration);
    }
};

export const updateToastProgress = (progress, subtext = null) => {
    const toast = document.getElementById('toast');
    if (!toast || !toast.classList.contains('show')) return;

    const progressBar = toast.querySelector('.toast-progress-bar');
    const subtextEl = toast.querySelector('.toast-subtext');

    if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;

    if (subtext !== null && subtextEl) {
        subtextEl.textContent = subtext;
        subtextEl.style.display = 'block';
    }

    if (progress >= 100) {
        const icon = toast.querySelector('.toast-icon');
        if (icon) {
            icon.className = 'toast-icon fas fa-check-circle';
        }
        toast.className = 'toast success show';

        const progressContainer = toast.querySelector('.toast-progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }

        if (toastTimeoutId) {
            clearTimeout(toastTimeoutId);
        }
        toastTimeoutId = setTimeout(() => {
            toast.classList.remove('show');
        }, 1500);
    }
};

export const hideToast = () => {
    const toast = document.getElementById('toast');
    if (toast) toast.classList.remove('show');
};

export const showModal = (modalId, onShow) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (modal.parentNode !== document.body) {
            document.body.appendChild(modal);
        }

        modal.style.display = 'flex';
        modal.style.zIndex = '99999';
        modal.classList.add('active');

        if (onShow) onShow(modal);
    }
};

export const hideModal = (modalId, onHide) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
                modal.style.zIndex = '';
            }
        }, 300);

        if (onHide) onHide(modal);
    }
};

export const initModalEvents = (onClose) => {
    document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                hideModal(modal.id);
                if (onClose) onClose(modal.id);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                hideModal(activeModal.id);
                if (onClose) onClose(activeModal.id);
            }
        }
    });
};
