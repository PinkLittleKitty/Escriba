import React, { useState, useEffect } from 'react';
import { Monitor, Download, X } from 'lucide-react';
import { storageService } from '../../services/storageService.js';
import styles from './DesktopDownloadPopup.module.css';

const DOWNLOAD_URL = 'https://github.com/PinkLittleKitty/Escriba/releases/tag/nightly';
const STORAGE_KEY = 'escriba_desktop_dismissed';

export const DesktopDownloadPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const isElectron = storageService.isElectron();
    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';

    if (!isElectron && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 250);
  };

  const handleDownload = () => {
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.popup} ${isClosing ? styles.closing : ''}`}
      role="dialog"
      aria-label="Descargar versión para PC"
    >
      <button
        type="button"
        className={styles.closeBtn}
        onClick={handleDismiss}
        title="Cerrar"
        aria-label="Cerrar aviso"
      >
        <X size={15} />
      </button>

      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Monitor size={20} className={styles.monitorIcon} />
        </div>
        <div className={styles.textContainer}>
          <h4 className={styles.title}>Escriba para escritorio</h4>
          <p className={styles.description}>
            Llevá Escriba a tu escritorio con almacenamiento local y atajos nativos.
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={handleDismiss}
        >
          Más tarde
        </button>
        <a
          href={DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.downloadBtn}
          onClick={handleDownload}
        >
          <Download size={14} />
          <span>Descargar</span>
        </a>
      </div>
    </div>
  );
};
