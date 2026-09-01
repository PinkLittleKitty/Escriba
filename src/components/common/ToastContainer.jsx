import React from 'react';
import { Info, CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore.js';
import styles from './Toast.module.css';

export const ToastContainer = () => {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  const renderIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'info':
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type] || styles.info}`}>
          <div className={styles.iconWrapper}>{renderIcon(toast.type)}</div>
          <span className={styles.message}>{toast.message}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => removeToast(toast.id)}
            title="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
