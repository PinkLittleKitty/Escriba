export const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');

    if (messageEl) messageEl.textContent = message;
    toast.className = `toast ${type}`;

    if (icon) {
        if (type === 'success') {
            icon.className = 'toast-icon fas fa-check-circle';
        } else if (type === 'error') {
            icon.className = 'toast-icon fas fa-exclamation-circle';
        } else if (type === 'info') {
            icon.className = 'toast-icon fas fa-info-circle';
        }
    }

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
};

export const showModal = (modalId, onShow) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        if (onShow) onShow(modal);
    }
};

export const hideModal = (modalId, onHide) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
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
