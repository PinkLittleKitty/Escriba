import React, { useCallback, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import {
  GitGraph,
  Eye,
  Code,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  ChevronDown,
  LayoutTemplate,
  AlertTriangle,
  RotateCcw,
  Download,
  Copy,
  Check,
  FileCode,
  Image
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import { MermaidAceEditor } from './MermaidAceEditor.jsx';
import { MermaidStudioModal } from './MermaidStudioModal.jsx';
import { UML_PRESETS } from './umlPresets.js';
import { getMermaidConfig, getPrintMermaidConfig } from './mermaidThemeConfig.js';
import {
  copySvgToClipboard,
  copyCodeToClipboard,
  exportSvgToFile,
  exportSvgToPng
} from './umlExportUtils.js';
import styles from './UMLBlock.module.css';

let mermaidIdCounter = 0;

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4.5;
const ZOOM_STEP = 0.15;

export const UMLBlock = ({
  code = `graph TD\n  Start([Inicio]) --> Step1[Paso 1: Procesar]\n  Step1 --> Decision{¿Es correcto?}\n  Decision -- Sí --> Success[Continuar]\n  Decision -- No --> Review[Revisar]\n  Success --> End([Fin])\n  Review --> End`,
  onChange,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [umlCode, setUmlCode] = useState(code);
  const [svgContent, setSvgContent] = useState('');
  const [printSvgContent, setPrintSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [blockHeight, setBlockHeight] = useState(520);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panAtDrag = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const svgContainerRef = useRef(null);

  const [showPresets, setShowPresets] = useState(false);
  const presetsRef = useRef(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    setUmlCode(code);
  }, [code]);

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
    let cancelled = false;

    const timer = setTimeout(async () => {
      mermaid.initialize(getMermaidConfig(theme));

      mermaidIdCounter += 1;
      const screenSvgId = `mermaid-svg-${mermaidIdCounter}`;
      const screenContainer = document.createElement('div');
      screenContainer.id = `mermaid-wrap-${mermaidIdCounter}`;
      screenContainer.className = styles.svgCanvas;
      screenContainer.style.cssText =
        'position:absolute;top:-9999px;left:-9999px;min-width:1800px;opacity:0;pointer-events:none;font-family:Inter,system-ui,-apple-system,sans-serif;font-size:14px;';
      document.body.appendChild(screenContainer);

      let renderedScreenSvg = '';
      try {
        const { svg } = await mermaid.render(screenSvgId, umlCode, screenContainer);
        renderedScreenSvg = svg.replace(/max-width:\s*[^;"]+;?/gi, '');
        if (!cancelled) {
          setSvgContent(renderedScreenSvg);
          setRenderError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(err.message || 'Error de sintaxis en el diagrama');
        }
      } finally {
        if (screenContainer.parentNode) screenContainer.remove();
      }

      const isLightTheme = theme === 'light' || theme === 'peluche' || theme === 'catppuccin-latte';
      let renderedPrintSvg = renderedScreenSvg;
      if (!isLightTheme && renderedScreenSvg) {
        try {
          mermaid.initialize(getPrintMermaidConfig());

          mermaidIdCounter += 1;
          const printSvgId = `mermaid-print-${mermaidIdCounter}`;
          const printContainer = document.createElement('div');
          printContainer.id = `mermaid-wrap-print-${mermaidIdCounter}`;
          printContainer.className = styles.svgCanvas;
          printContainer.style.cssText =
            'position:absolute;top:-9999px;left:-9999px;min-width:1800px;opacity:0;pointer-events:none;font-family:Inter,system-ui,-apple-system,sans-serif;font-size:14px;';
          document.body.appendChild(printContainer);

          try {
            const { svg } = await mermaid.render(printSvgId, umlCode, printContainer);
            renderedPrintSvg = svg.replace(/max-width:\s*[^;"]+;?/gi, '');
          } finally {
            if (printContainer.parentNode) printContainer.remove();
          }
        } catch (e) {
          renderedPrintSvg = renderedScreenSvg;
        }
      }

      if (!cancelled && renderedPrintSvg) {
        setPrintSvgContent(renderedPrintSvg);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [umlCode, theme]);

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
  }, [handleWheel, activeTab]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0 && e.button !== 1) return;
    const rect = e.currentTarget?.getBoundingClientRect();
    if (rect) {
      if (e.clientY > rect.bottom - 20 || e.clientX > rect.right - 20) {
        return;
      }
    }
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panAtDrag.current = pan;
  }, [pan]);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingHeight(true);
    const startY = e.clientY;
    const startHeight = blockHeight;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(280, Math.min(startHeight + deltaY, 1200));
      setBlockHeight(Math.round(newHeight));
    };

    const handleMouseUp = () => {
      setIsResizingHeight(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [blockHeight]);

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

  const applyPreset = (preset) => {
    setUmlCode(preset.code);
    if (onChange) onChange(preset.code);
    setShowPresets(false);
  };

  const zoomIn = (e) => {
    e.stopPropagation();
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  };

  const zoomOut = (e) => {
    e.stopPropagation();
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  };

  const resetView = (e) => {
    e.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCodeChange = (newVal) => {
    setUmlCode(newVal);
    if (onChange) onChange(newVal);
  };

  const handleCopySvg = async (e) => {
    if (e) e.stopPropagation();
    const ok = await copySvgToClipboard(svgContent);
    if (ok) {
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    }
  };

  const handleCopyCode = async (e) => {
    if (e) e.stopPropagation();
    const ok = await copyCodeToClipboard(umlCode);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadSvg = (e) => {
    if (e) e.stopPropagation();
    exportSvgToFile(svgContent, 'diagrama-mermaid.svg');
  };

  const handleDownloadPng = (e) => {
    if (e) e.stopPropagation();
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (svgEl) {
      exportSvgToPng(svgEl, 'diagrama-mermaid.png');
    }
  };

  const stopProp = (e) => e.stopPropagation();

  return (
    <div
      className={styles.umlContainer}
      data-uml-code={umlCode}
      contentEditable={false}
      onMouseDown={stopProp}
      onClick={stopProp}
      onKeyDown={stopProp}
    >
      <div className={styles.screenWrapper}>
        <div className={styles.umlHeader}>
          <div className={styles.headerLeft}>
            <GitGraph size={15} color="var(--accent-purple, #a855f7)" />
            <span className={styles.headerTitle}>Diagrama UML</span>

            <div className={styles.presetsWrapper} ref={presetsRef}>
              <button
                type="button"
                className={styles.presetsBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPresets((v) => !v);
                }}
                title="Galería de Plantillas"
              >
                <LayoutTemplate size={12} />
                <span>Plantillas</span>
                <ChevronDown size={11} />
              </button>
              {showPresets && (
                <div className={styles.presetsDropdown}>
                  {UML_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={styles.presetItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        applyPreset(p);
                      }}
                    >
                      <span className={styles.presetItemTitle}>{p.label}</span>
                      <span className={styles.presetItemDesc}>{p.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.tabGroup}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.active : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('preview');
              }}
              title="Vista Previa Interactiva"
            >
              <Eye size={12} />
              <span>Vista</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'split' ? styles.active : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('split');
              }}
              title="Vista Dividida (Editor + Diagrama)"
            >
              <Columns size={12} />
              <span>Split</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'code' ? styles.active : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('code');
              }}
              title="Editor de Código"
            >
              <Code size={12} />
              <span>Código</span>
            </button>
          </div>

          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.studioBtn}
              onClick={(e) => {
                e.stopPropagation();
                setIsStudioOpen(true);
              }}
              title="Abrir en Estudio UML"
            >
              <Maximize2 size={12} />
              <span>Estudio UML</span>
            </button>

            {(activeTab === 'preview' || activeTab === 'split') && (
              <div className={styles.zoomControls}>
                <button type="button" className={styles.actionBtn} onClick={zoomOut} title="Alejar (-)">
                  <ZoomOut size={12} />
                </button>
                <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
                <button type="button" className={styles.actionBtn} onClick={zoomIn} title="Acercar (+)">
                  <ZoomIn size={12} />
                </button>
                <button type="button" className={styles.actionBtn} onClick={resetView} title="Restablecer vista (100%)">
                  <RotateCcw size={11} />
                </button>
              </div>
            )}

            <div className={styles.exportMenuWrapper} ref={exportMenuRef}>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExportMenu((v) => !v);
                }}
                title="Exportar y copiar diagrama"
              >
                <Download size={12} />
                <span>Exportar</span>
                <ChevronDown size={11} />
              </button>
              {showExportMenu && (
                <div className={styles.exportDropdown}>
                  <button
                    type="button"
                    className={styles.exportItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopySvg();
                      setShowExportMenu(false);
                    }}
                  >
                    {copiedSvg ? <Check size={12} color="var(--accent-green, #10b981)" /> : <Copy size={12} />}
                    <span>{copiedSvg ? 'SVG Copiado' : 'Copiar SVG'}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.exportItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCode();
                      setShowExportMenu(false);
                    }}
                  >
                    {copiedCode ? <Check size={12} color="var(--accent-green, #10b981)" /> : <Code size={12} />}
                    <span>{copiedCode ? 'Código Copiado' : 'Copiar Código'}</span>
                  </button>
                  <div className={styles.exportDivider} />
                  <button
                    type="button"
                    className={styles.exportItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSvg();
                      setShowExportMenu(false);
                    }}
                  >
                    <FileCode size={12} />
                    <span>Descargar SVG</span>
                  </button>
                  <button
                    type="button"
                    className={styles.exportItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPng();
                      setShowExportMenu(false);
                    }}
                  >
                    <Image size={12} />
                    <span>Descargar PNG</span>
                  </button>
                </div>
              )}
            </div>

            {onDelete && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Eliminar bloque"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {activeTab === 'split' ? (
          <div className={styles.splitLayout} style={{ height: `${blockHeight}px` }}>
            <div
              ref={viewportRef}
              className={`${styles.previewArea} ${isDragging.current ? styles.dragging : ''}`}
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

              {renderError && (
                <div className={styles.errorFloatingBadge} title={renderError}>
                  <AlertTriangle size={13} />
                  <span>{renderError}</span>
                </div>
              )}
            </div>

            <div className={styles.splitEditorWrapper}>
              <MermaidAceEditor
                value={umlCode}
                onChange={handleCodeChange}
                theme={theme}
              />
            </div>
          </div>
        ) : activeTab === 'preview' ? (
          <div
            ref={viewportRef}
            className={`${styles.previewArea} ${isDragging.current ? styles.dragging : ''}`}
            style={{ height: `${blockHeight}px` }}
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

            {renderError && (
              <div className={styles.errorFloatingBadge} title={renderError}>
                <AlertTriangle size={13} />
                <span>{renderError}</span>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.codeModeWrapper} style={{ height: `${blockHeight}px` }}>
            <MermaidAceEditor
              value={umlCode}
              onChange={handleCodeChange}
              theme={theme}
            />
          </div>
        )}

        <div
          className={`${styles.heightResizeBar} ${isResizingHeight ? styles.resizing : ''}`}
          onMouseDown={handleResizeStart}
          onDoubleClick={() => setBlockHeight(520)}
          title="Arrastrar para ajustar altura del bloque (Doble clic para 520px)"
          data-testid="uml-height-resize-bar"
        >
          <div className={styles.resizeHandlePill} />
        </div>
      </div>

      <textarea
        className="sr-only"
        readOnly
        value={umlCode}
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {printSvgContent && (
        <div
          className={styles.printWrapper}
          dangerouslySetInnerHTML={{ __html: printSvgContent }}
        />
      )}

      <MermaidStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        initialCode={umlCode}
        onSave={handleCodeChange}
        onCodeChange={handleCodeChange}
        theme={theme}
        svgContent={svgContent}
        renderError={renderError}
      />
    </div>
  );
};
