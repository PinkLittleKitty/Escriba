import React, { useState, useEffect } from 'react';
import {
  Rocket,
  X,
  Download,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Package,
  FileText
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore.js';
import { updaterService } from '../../services/updaterService.js';
import styles from './UpdateModal.module.css';

function renderReleaseNotes(markdown) {
  if (!markdown) return <p>No hay notas de versión disponibles.</p>;

  const lines = markdown.split('\n');
  const elements = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={index}>{trimmed.replace('### ', '')}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={index}>{trimmed.replace('## ', '')}</h2>);
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      elements.push(
        <li key={index}>
          {trimmed.substring(2)}
        </li>
      );
    } else if (trimmed.length > 0) {
      elements.push(<p key={index}>{trimmed}</p>);
    }
  });

  return elements;
}

export const UpdateModal = () => {
  const modalData = useUIStore((state) => state.modalData);
  const closeModal = useUIStore((state) => state.closeModal);

  const [release, setRelease] = useState(modalData?.release || null);
  const [loading, setLoading] = useState(!modalData?.release);

  useEffect(() => {
    if (!modalData?.release) {
      setLoading(true);
      updaterService.checkForUpdates().then((res) => {
        if (res.release) {
          setRelease(res.release);
        }
        setLoading(false);
      });
    } else {
      setRelease(modalData.release);
      setLoading(false);
    }
  }, [modalData]);

  const handleDownload = (url) => {
    const targetUrl = url || release?.downloadUrl || release?.htmlUrl;
    if (targetUrl) {
      updaterService.openDownloadUrl(targetUrl);
    }
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.titleRow}>
            <div className={styles.iconBadge}>
              <Rocket size={20} />
            </div>
            <div className={styles.headerText}>
              <h3>¡Nueva Versión Disponible!</h3>
              <span className={styles.tagBadge}>
                {release?.tagName || 'v. Nightly'}
              </span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={closeModal} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Buscando detalles de la última versión...
            </div>
          ) : (
            <>
              <div className={styles.versionMeta}>
                <div className={styles.releaseDate}>
                  <Calendar size={14} color="var(--accent-blue)" />
                  <span>Publicada: {release?.publishedAtFormatted || 'Recientemente'}</span>
                </div>
                <div>
                  Canal: <strong>{release?.tagName?.includes('nightly') ? 'Nightly' : 'Estable'}</strong>
                </div>
              </div>

              <div className={styles.notesSection}>
                <span className={styles.notesLabel}>Novedades y Cambios:</span>
                <div className={styles.notesBox}>
                  {renderReleaseNotes(release?.body)}
                </div>
              </div>

              {release?.assets && release.assets.length > 0 && (
                <div className={styles.downloadOptions}>
                  <span className={styles.notesLabel}>Descargas Directas:</span>
                  <div className={styles.directDownloads}>
                    {release.assets.map((asset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={styles.assetChip}
                        onClick={() => handleDownload(asset.downloadUrl)}
                        title={`Descargar ${asset.name}`}
                      >
                        <Package size={13} color="var(--accent-blue)" />
                        <span>{asset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeModal}
          >
            Recordar más tarde
          </button>

          <div className={styles.footerActionsRight}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleDownload(release?.downloadUrl)}
            >
              <Download size={14} />
              <span>Descargar Actualización</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
