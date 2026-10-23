import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  GitGraph,
  X,
  Copy,
  Check,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  LayoutTemplate,
  Code,
  FileCode,
  Image
} from 'lucide-react';
import { MermaidAceEditor } from './MermaidAceEditor.jsx';
import { UML_PRESETS } from './umlPresets.js';
import {
  copySvgToClipboard,
  copyCodeToClipboard,
  exportSvgToFile,
  exportSvgToPng
} from './umlExportUtils.js';
import styles from './MermaidStudioModal.module.css';

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.2;

export const MermaidStudioModal = ({
  isOpen,
  onClose,
  initialCode = '',
  onSave,
  theme = 'dark',
  svgContent = '',
  renderError = null,
  isRendering = false,
  onCodeChange
}) => {
  if (!isOpen) return null;

  const [code, setCode] = useState(initialCode);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showPresets, setShowPresets] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(480);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const presetsRef = useRef(null);
  const exportMenuRef = useRef(null);
  const viewportRef = useRef(null);
  const svgContainerRef = useRef(null);
  const studioContainerRef = useRef(null);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panAtDrag = useRef({ x: 0, y: 0 });

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingSidebar(true);

    const handleMouseMove = (moveEvent) => {
      if (!studioContainerRef.current) return;
      const containerRect = studioContainerRef.current.getBoundingClientRect();
      const newWidth = moveEvent.clientX - containerRect.left;
      const maxWidth = containerRect.width * 0.75;
      const clampedWidth = Math.max(280, Math.min(newWidth, maxWidth));
      setSidebarWidth(Math.round(clampedWidth));
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    const handler = (e) => {
      if (presetsRef.current && !presetsRef.current.contains(e.target)) {
        setShowPresets(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleEditorChange = (newVal) => {
    setCode(newVal);
    if (onCodeChange) onCodeChange(newVal);
    if (onSave) onSave(newVal);
  };

  const handleApplyPreset = (preset) => {
    setCode(preset.code);
    if (onCodeChange) onCodeChange(preset.code);
    if (onSave) onSave(preset.code);
    setShowPresets(false);
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))));
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0 && e.button !== 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panAtDrag.current = pan;
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    setPan({
      x: panAtDrag.current.x + (e.clientX - dragStart.current.x),
      y: panAtDrag.current.y + (e.clientY - dragStart.current.y),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCopySvg = async () => {
    const ok = await copySvgToClipboard(svgContent);
    if (ok) {
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const ok = await copyCodeToClipboard(code);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadSvg = () => {
    exportSvgToFile(svgContent, 'diagrama-mermaid.svg');
  };

  const handleDownloadPng = () => {
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (svgEl) {
      exportSvgToPng(svgEl, 'diagrama-mermaid.png');
    }
  };

  const lineCount = (code || '').split('\n').length;
  const charCount = (code || '').length;

  return ReactDOM.createPortal(
    <div className={styles.studioOverlay} onClick={onClose}>
      <div
        ref={studioContainerRef}
        className={styles.studioContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.studioHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.brandBadge}>
              <GitGraph size={16} />
              <span>Estudio UML</span>
            </div>
            <div className={styles.presetsWrapper} ref={presetsRef}>
              <button
                type="button"
                className={styles.dropdownBtn}
                onClick={() => setShowPresets((v) => !v)}
              >
                <LayoutTemplate size={14} />
                <span>Plantillas</span>
                <ChevronDown size={13} />
              </button>
              {showPresets && (
                <div className={styles.presetsDropdown}>
                  {UML_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={styles.presetItem}
                      onClick={() => handleApplyPreset(p)}
                    >
                      <span className={styles.presetItemTitle}>{p.label}</span>
                      <span className={styles.presetItemDesc}>{p.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.exportMenuWrapper} ref={exportMenuRef}>
              <button
                type="button"
                className={styles.dropdownBtn}
                onClick={() => setShowExportMenu((v) => !v)}
                title="Exportar y copiar diagrama"
              >
                <Download size={13} />
                <span>Exportar</span>
                <ChevronDown size={12} />
              </button>
              {showExportMenu && (
                <div className={styles.exportDropdown}>
                  <button
                    type="button"
                    className={styles.exportItem}
                    onClick={() => {
                      handleCopySvg();
                      setShowExportMenu(false);
                    }}
                  >
                    {copiedSvg ? <Check size={13} color="var(--accent-green, #10b981)" /> : <Copy size={13} />}
                    <span>{copiedSvg ? 'SVG Copiado' : 'Copiar SVG'}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.exportItem}
                    onClick={() => {
                      handleCopyCode();
                      setShowExportMenu(false);
                    }}
                  >
                    {copiedCode ? <Check size={13} color="var(--accent-green, #10b981)" /> : <Code size={13} />}
                    <span>{copiedCode ? 'Código Copiado' : 'Copiar Código'}</span>
                  </button>
                  <div className={styles.exportDivider} />
                  <button
                    type="button"
                    className={styles.exportItem}
                    onClick={() => {
                      handleDownloadSvg();
                      setShowExportMenu(false);
                    }}
                  >
                    <FileCode size={13} />
                    <span>Descargar SVG</span>
                  </button>
                  <button
                    type="button"
                    className={styles.exportItem}
                    onClick={() => {
                      handleDownloadPng();
                      setShowExportMenu(false);
                    }}
                  >
                    <Image size={13} />
                    <span>Descargar PNG</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Cerrar estudio (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className={styles.studioBody}>
          <div
            className={styles.editorPane}
            style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}
          >
            <div className={styles.paneHeader}>
              <span>Editor de Código</span>
              <span className={styles.editorStats}>
                {lineCount} {lineCount === 1 ? 'línea' : 'líneas'} · {charCount} chars
              </span>
            </div>
            <div className={styles.editorWrapper}>
              <MermaidAceEditor
                value={code}
                onChange={handleEditorChange}
                theme={theme}
                fontSize={13}
                autoFocus={true}
              />
            </div>
          </div>

          <div
            className={`${styles.resizeDivider} ${isResizingSidebar ? styles.resizing : ''}`}
            onMouseDown={handleResizeStart}
            title="Arrastrar para redimensionar panel"
          >
            <div className={styles.dividerLine} />
          </div>

          <div className={styles.previewPane}>
            {isRendering && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner} />
                <span>Renderizando...</span>
              </div>
            )}

            <div
              ref={viewportRef}
              className={`${styles.canvasViewport} ${isDragging.current ? styles.dragging : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={svgContainerRef}
                className={styles.svgCanvas}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>

            {renderError && (
              <div className={styles.floatingError}>
                <AlertTriangle size={16} className={styles.errorIcon} />
                <div className={styles.errorContent}>
                  <span className={styles.errorTitle}>Error de Sintaxis</span>
                  <span className={styles.errorMessage}>{renderError}</span>
                </div>
              </div>
            )}

            <div className={styles.floatingControls}>
              <button type="button" className={styles.controlBtn} onClick={zoomOut} title="Alejar (-)">
                <ZoomOut size={14} />
              </button>
              <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
              <button type="button" className={styles.controlBtn} onClick={zoomIn} title="Acercar (+)">
                <ZoomIn size={14} />
              </button>
              <button type="button" className={styles.controlBtn} onClick={resetView} title="Restablecer (100%)">
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
