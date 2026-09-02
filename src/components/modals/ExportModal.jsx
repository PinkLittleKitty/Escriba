import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Share2,
  Download,
  Copy,
  Check,
  FileText,
  Code,
  Globe,
  Printer,
  Package,
  FolderDown,
  X,
  ExternalLink,
  Link as LinkIcon,
  QrCode,
  GitBranch,
  Mail,
  MessageCircle,
  Folder
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { useGitHubStore } from '../../store/useGitHubStore.js';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import {
  downloadFile,
  convertHtmlToMarkdown,
  convertHtmlToStandaloneHtml,
  generateShareUrl
} from '../../utils/exportHelpers.js';
import styles from './Modal.module.css';

export const ExportModal = () => {
  const closeModal = useUIStore((state) => state.closeModal);
  const modalData = useUIStore((state) => state.modalData);
  const addToast = useUIStore((state) => state.addToast);

  const subjects = useNotesStore((state) => state.subjects);
  const activeSubjectId = useNotesStore((state) => state.activeSubjectId);
  const activeNoteId = useNotesStore((state) => state.activeNoteId);
  const theme = useSettingsStore((state) => state.theme);

  const { isAuthenticated, username, repoName, token } = useGitHubStore();

  const isSubjectMode = !!modalData?.subject;
  const [activeTab, setActiveTab] = useState('qr');
  const [copiedKey, setCopiedKey] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [shareMethod, setShareMethod] = useState('direct');
  const [isGenerating, setIsGenerating] = useState(true);

  let currentSubject = modalData?.subject || subjects.find((s) => s.id === activeSubjectId);
  let currentNote = modalData?.note || null;

  if (!isSubjectMode && !currentNote && activeNoteId) {
    for (const s of subjects) {
      const found = s.notes.find((n) => n.id === activeNoteId);
      if (found) {
        currentNote = found;
        currentSubject = s;
        break;
      }
    }
  }

  const titleText = isSubjectMode ? currentSubject?.name || 'Materia' : currentNote?.title || 'Apunte sin título';
  const noteContent = currentNote?.content || '';
  const subjectName = currentSubject?.name || 'Materia';

  useEffect(() => {
    let cancelled = false;

    const buildShareLink = async () => {
      setIsGenerating(true);

      const target = isSubjectMode ? currentSubject : currentNote;
      if (!target) return;

      const res = await generateShareUrl(target, {
        type: isSubjectMode ? 'subject' : 'note',
        subjectName,
        github: { isAuthenticated, username, repoName, token }
      });

      if (!cancelled && res?.url) {
        setShareUrl(res.url);
        setShareMethod(res.method);

        QRCode.toDataURL(
          res.url,
          {
            width: 260,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' }
          },
          (err, dataUrl) => {
            if (!cancelled && !err && dataUrl) {
              setQrDataUrl(dataUrl);
            }
          }
        );
      }
      if (!cancelled) setIsGenerating(false);
    };

    buildShareLink();
    return () => { cancelled = true; };
  }, [currentNote, currentSubject, isSubjectMode, isAuthenticated, username, repoName, token, subjectName]);

  const copyWithFeedback = (key, text, toastMsg) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast({ message: toastMsg || 'Copiado al portapapeles', type: 'success' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyShareUrl = () => {
    copyWithFeedback('shareUrl', shareUrl, 'Enlace para compartir copiado');
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${titleText.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast({ message: 'Código QR descargado (PNG)', type: 'success' });
  };

  const handleShareWhatsApp = () => {
    const text = isSubjectMode
      ? `Te comparto mi materia en Escriba: "${titleText}" (${currentSubject?.notes?.length || 0} apuntes)\n\n${shareUrl}`
      : `Te comparto mis apuntes de ${subjectName}: "${titleText}" en Escriba\n\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(isSubjectMode ? `Materia: ${titleText}` : `Apunte: ${titleText} (${subjectName})`);
    const body = encodeURIComponent(`Hola! Te comparto este contenido de Escriba:\n\n${titleText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: titleText,
          text: isSubjectMode ? `Materia: ${titleText}` : `Apunte: ${titleText} (${subjectName})`,
          url: shareUrl
        });
        addToast({ message: 'Compartido con éxito', type: 'success' });
      } catch (e) {
        if (e.name !== 'AbortError') {
          handleCopyShareUrl();
        }
      }
    } else {
      handleCopyShareUrl();
    }
  };

  const sanitizeFilename = (name) => name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'escriba_export';

  const handleExportMarkdown = () => {
    if (isSubjectMode) {
      let fullMd = `# Materia: ${titleText}\n\n`;
      (currentSubject?.notes || []).forEach((n) => {
        fullMd += `${convertHtmlToMarkdown(n.content, n.title, titleText)}\n\n---\n\n`;
      });
      downloadFile(`${sanitizeFilename(titleText)}_apuntes.md`, fullMd, 'text/markdown;charset=utf-8');
    } else {
      const md = convertHtmlToMarkdown(noteContent, titleText, subjectName);
      downloadFile(`${sanitizeFilename(titleText)}.md`, md, 'text/markdown;charset=utf-8');
    }
    addToast({ message: 'Archivo Markdown descargado', type: 'success' });
  };

  const handleExportHTML = () => {
    if (isSubjectMode) {
      let combinedHTML = `<h1>Materia: ${titleText}</h1>`;
      (currentSubject?.notes || []).forEach((n) => {
        combinedHTML += `<div style="margin-bottom: 3rem; border-bottom: 2px solid var(--border-color); padding-bottom: 2rem;"><h2>${n.title}</h2><div>${n.content}</div></div>`;
      });
      const htmlDoc = convertHtmlToStandaloneHtml(combinedHTML, titleText, 'Materia', theme);
      downloadFile(`${sanitizeFilename(titleText)}.html`, htmlDoc, 'text/html;charset=utf-8');
    } else {
      const htmlDoc = convertHtmlToStandaloneHtml(noteContent, titleText, subjectName, theme);
      downloadFile(`${sanitizeFilename(titleText)}.html`, htmlDoc, 'text/html;charset=utf-8');
    }
    addToast({ message: 'Página HTML descargada', type: 'success' });
  };

  const handleExportTxt = () => {
    if (isSubjectMode) {
      let text = `MATERIA: ${titleText}\nFecha: ${new Date().toLocaleDateString()}\n\n`;
      (currentSubject?.notes || []).forEach((n) => {
        const temp = document.createElement('div');
        temp.innerHTML = n.content;
        text += `==============================\n${n.title}\n==============================\n${temp.innerText || temp.textContent || ''}\n\n`;
      });
      downloadFile(`${sanitizeFilename(titleText)}.txt`, text, 'text/plain;charset=utf-8');
    } else {
      const temp = document.createElement('div');
      temp.innerHTML = noteContent;
      const text = `${titleText}\nMateria: ${subjectName}\nFecha: ${new Date().toLocaleDateString()}\n\n${temp.innerText || temp.textContent || ''}`;
      downloadFile(`${sanitizeFilename(titleText)}.txt`, text, 'text/plain;charset=utf-8');
    }
    addToast({ message: 'Documento de texto descargado', type: 'success' });
  };

  const handleExportJSON = () => {
    const data = isSubjectMode ? currentSubject : { ...currentNote, subjectName, exportDate: new Date().toISOString() };
    downloadFile(`${sanitizeFilename(titleText)}.json`, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
    addToast({ message: 'Archivo JSON descargado', type: 'success' });
  };

  const handlePrint = () => {
    closeModal();
    setTimeout(() => { window.print(); }, 150);
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <Share2 size={18} color="var(--accent-blue)" />
            <span>Compartir {isSubjectMode ? 'Materia' : 'Apunte'}</span>
          </h3>
          <button type="button" className={styles.closeBtn} onClick={closeModal} title="Cerrar" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {isAuthenticated && (
          <div
            style={{
              padding: '0.6rem 1.25rem',
              background: 'rgba(59, 130, 246, 0.08)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <GitBranch size={14} color="var(--accent-blue)" />
              <span>GitHub: <strong>{username}/{repoName}</strong></span>
            </div>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
              {shareMethod === 'github_repo' ? '✓ Repositorio' : shareMethod === 'gist' ? '✓ Gist' : '✓ Enlace directo'}
            </span>
          </div>
        )}

        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
              {titleText}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isSubjectMode ? `${currentSubject?.notes?.length || 0} apuntes contenidos` : subjectName}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', background: 'var(--accent-blue-subtle, rgba(59, 130, 246, 0.15))', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
            {isSubjectMode ? 'Materia' : 'Apunte'}
          </span>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.65rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'qr' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'qr' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'qr' ? '2px solid var(--accent-blue)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveTab('qr')}
          >
            <QrCode size={14} />
            <span>QR y Enlace</span>
          </button>

          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.65rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'export' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'export' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'export' ? '2px solid var(--accent-blue)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveTab('export')}
          >
            <Download size={14} />
            <span>Exportar Archivos</span>
          </button>
        </div>

        <div className={styles.modalBody} style={{ padding: '1.25rem' }}>
          {activeTab === 'qr' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
              <div
                style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
                ) : (
                  <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    {isGenerating ? 'Generando QR...' : 'QR no disponible'}
                  </div>
                )}
              </div>

              <div style={{ width: '100%' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                  Escaneá desde otro dispositivo o enviá el enlace para transferir este contenido directamente.
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-tertiary)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={isGenerating ? 'Generando enlace...' : shareUrl}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    onClick={handleCopyShareUrl}
                    disabled={isGenerating}
                  >
                    {copiedKey === 'shareUrl' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedKey === 'shareUrl' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center', padding: '0.5rem' }}
                  onClick={handleShareWhatsApp}
                  disabled={isGenerating}
                  title="Compartir por WhatsApp"
                >
                  <MessageCircle size={15} color="#25D366" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center', padding: '0.5rem' }}
                  onClick={handleShareEmail}
                  disabled={isGenerating}
                  title="Compartir por Email"
                >
                  <Mail size={15} color="var(--accent-blue)" />
                  <span>Email</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center', padding: '0.5rem' }}
                  onClick={handleDownloadQR}
                  disabled={!qrDataUrl}
                  title="Descargar imagen QR"
                >
                  <Download size={15} />
                  <span>Descargar QR</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
                onClick={handleExportMarkdown}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)' }}>
                  <Code size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Markdown</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Archivo .md estándar</span>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
                onClick={handleExportHTML}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
                  <Globe size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Página Web</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Archivo .html con estilos</span>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
                onClick={handleExportTxt}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-green)' }}>
                  <FileText size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Texto Plano</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Archivo .txt simple</span>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
                onClick={handleExportJSON}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-yellow)' }}>
                  <Package size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>JSON Backup</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estructura de datos .json</span>
              </div>

              {!isSubjectMode && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                  onClick={handlePrint}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)' }}>
                    <Printer size={18} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Imprimir / PDF</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Guardar como PDF</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
