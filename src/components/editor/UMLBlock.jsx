import React, { useCallback, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { GitGraph, Eye, Code, Trash2, ZoomIn, ZoomOut, Maximize2, Columns, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import styles from './UMLBlock.module.css';

let mermaidIdCounter = 0;

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.15;

const PRESETS = [
  {
    label: 'Diagrama de Clases',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()`,
  },
  {
    label: 'Diagrama de Secuencia',
    code: `sequenceDiagram
    Alice->>Bob: Hola Bob, ¿cómo estás?
    Bob-->>Alice: ¡Muy bien, gracias!`,
  },
  {
    label: 'Diagrama de Flujo',
    code: `graph TD
    A[Inicio] --> B{¿Es correcto?}
    B -- Sí --> C[OK]
    C --> D[Continuar]
    D --> B
    B -- No ----> E[Fin]`,
  },
  {
    label: 'Diagrama ER',
    code: `erDiagram
    CLIENTE ||--o{ PEDIDO : realiza
    PEDIDO ||--|{ ITEM : contiene`,
  },
  {
    label: 'Diagrama de Estados',
    code: `stateDiagram-v2
    [*] --> Quieto
    Quieto --> [*]
    Quieto --> Moviendo
    Moviendo --> Quieto
    Moviendo --> Choque
    Choque --> [*]`,
  },
  {
    label: 'Gráfico de Torta',
    code: `pie title Distribución
    "Categoría A" : 40
    "Categoría B" : 35
    "Categoría C" : 25`,
  },
  {
    label: 'Journey',
    code: `journey
    title Mi día de trabajo
    section Ir al trabajo
      Preparar mate: 5: Yo
      Subir la escalera: 3: Yo
      Trabajar: 1: Yo
    section Volver a casa
      Bajar la escalera: 5: Yo
      Sentarme: 3: Yo`,
  },
];

export const UMLBlock = ({
  code = `graph TD\n  A[Inicio] --> B{¿Es correcto?}\n  B -->|Sí| C[Continuar]\n  B -->|No| D[Revisar]`,
  onChange,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [umlCode, setUmlCode] = useState(code);
  const [svgContent, setSvgContent] = useState('');
  const [printSvgContent, setPrintSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [isRendering, setIsRendering] = useState(true);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panAtDrag = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const [showPresets, setShowPresets] = useState(false);
  const presetsRef = useRef(null);

  useEffect(() => { setUmlCode(code); }, [code]);

  useEffect(() => {
    const handler = (e) => {
      if (presetsRef.current && !presetsRef.current.contains(e.target)) {
        setShowPresets(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [svgContent]);

  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      setIsRendering(true);
      setRenderError(null);

      const isLightTheme = theme === 'light' || theme === 'sepia' || theme === 'sakura' || theme === 'peluche';

      mermaid.initialize({
        startOnLoad: false,
        theme: isLightTheme ? 'default' : 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      });

      mermaidIdCounter += 1;
      const screenSvgId = `mermaid-svg-${mermaidIdCounter}`;
      const screenContainer = document.createElement('div');
      screenContainer.id = `mermaid-wrap-${mermaidIdCounter}`;
      screenContainer.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:900px;opacity:0;pointer-events:none;';
      document.body.appendChild(screenContainer);

      let renderedScreenSvg = '';
      try {
        const { svg } = await mermaid.render(screenSvgId, umlCode, screenContainer);
        renderedScreenSvg = svg.replace(/max-width:\s*[^;"]+;?/gi, '');
      } catch (err) {
        console.warn('[UMLBlock] Mermaid error:', err);
        if (!cancelled) {
          setRenderError(err.message || 'Error de sintaxis en el diagrama');
          setSvgContent('');
          setPrintSvgContent('');
        }
        if (screenContainer.parentNode) screenContainer.remove();
        if (!cancelled) setIsRendering(false);
        return;
      } finally {
        if (screenContainer.parentNode) screenContainer.remove();
      }

      let renderedPrintSvg = renderedScreenSvg;
      if (!isLightTheme) {
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            themeVariables: {
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              fontSize: '14px',
              primaryColor: '#f8fafc',
              primaryBorderColor: '#334155',
              primaryTextColor: '#0f172a',
              lineColor: '#334155',
              textColor: '#0f172a',
              classText: '#0f172a',
              nodeBorder: '#334155',
              clusterBkg: '#ffffff',
              clusterBorder: '#64748b',
            }
          });

          mermaidIdCounter += 1;
          const printSvgId = `mermaid-print-${mermaidIdCounter}`;
          const printContainer = document.createElement('div');
          printContainer.id = `mermaid-wrap-print-${mermaidIdCounter}`;
          printContainer.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:900px;opacity:0;pointer-events:none;';
          document.body.appendChild(printContainer);

          try {
            const { svg } = await mermaid.render(printSvgId, umlCode, printContainer);
            renderedPrintSvg = svg.replace(/max-width:\s*[^;"]+;?/gi, '');
          } finally {
            if (printContainer.parentNode) printContainer.remove();
          }
        } catch (e) {
          console.warn('[UMLBlock] Print render fallback:', e);
          renderedPrintSvg = renderedScreenSvg;
        }
      }

      if (!cancelled) {
        setSvgContent(renderedScreenSvg);
        setPrintSvgContent(renderedPrintSvg);
        setRenderError(null);
        setIsRendering(false);
      }
    };

    renderDiagram();
    return () => { cancelled = true; };
  }, [umlCode, theme]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(3))));
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, activeTab]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
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

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const applyPreset = (preset) => {
    setUmlCode(preset.code);
    if (onChange) onChange(preset.code);
    setShowPresets(false);
    setActiveTab('preview');
  };
  const zoomIn = (e) => { e.stopPropagation(); setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(3))); };
  const zoomOut = (e) => { e.stopPropagation(); setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(3))); };
  const resetView = (e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); };


  const handleCodeChange = (e) => {
    const val = e.target.value;
    setUmlCode(val);
    if (onChange) onChange(val);
  };

  const stopProp = (e) => e.stopPropagation();
  const eatMouseDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    return (
      <div
        className={styles.umlContainer}
        contentEditable={false}
        onMouseDown={stopProp}
        onClick={stopProp}
      >
        <div className={styles.screenWrapper}>
          <div className={styles.umlHeader}>
            <div className={styles.headerLeft}>
              <GitGraph size={14} color="var(--accent-purple)" />
              <span className={styles.headerTitle}>Diagrama UML</span>
              <div className={styles.presetsWrapper} ref={presetsRef}>
                <button
                  type="button"
                  className={styles.presetsBtn}
                  onMouseDown={eatMouseDown}
                  onClick={(e) => { e.stopPropagation(); setShowPresets((v) => !v); }}
                  title="Plantillas"
                >
                  Plantillas <ChevronDown size={11} />
                </button>
                {showPresets && (
                  <div className={styles.presetsDropdown}>
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        className={styles.presetItem}
                        onMouseDown={eatMouseDown}
                        onClick={(e) => { e.stopPropagation(); applyPreset(p); }}
                      >
                        {p.label}
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
                onMouseDown={eatMouseDown}
                onClick={(e) => { e.stopPropagation(); setActiveTab('preview'); }}
              >
                <Eye size={12} />
                <span>Vista Previa</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'split' ? styles.active : ''}`}
                onMouseDown={eatMouseDown}
                onClick={(e) => { e.stopPropagation(); setActiveTab('split'); }}
              >
                <Columns size={12} />
                <span>Split</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'code' ? styles.active : ''}`}
                onMouseDown={eatMouseDown}
                onClick={(e) => { e.stopPropagation(); setActiveTab('code'); }}
              >
                <Code size={12} />
                <span>Código</span>
              </button>
            </div>

            <div className={styles.headerRight}>
              <div
                className={styles.zoomControls}
                style={{
                  visibility: (activeTab === 'preview' || activeTab === 'split') && !isRendering && !renderError
                    ? 'visible' : 'hidden',
                  pointerEvents: (activeTab === 'preview' || activeTab === 'split') && !isRendering && !renderError
                    ? 'auto' : 'none',
                }}
              >
                <button type="button" className={styles.actionBtn} onMouseDown={eatMouseDown} onClick={zoomOut} title="Alejar">
                  <ZoomOut size={12} />
                </button>
                <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
                <button type="button" className={styles.actionBtn} onMouseDown={eatMouseDown} onClick={zoomIn} title="Acercar">
                  <ZoomIn size={12} />
                </button>
                <button type="button" className={styles.actionBtn} onMouseDown={eatMouseDown} onClick={resetView} title="Restablecer vista">
                  <Maximize2 size={12} />
                </button>
              </div>
              {onDelete && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onMouseDown={eatMouseDown}
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  title="Eliminar diagrama"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {activeTab === 'split' ? (
            <div className={styles.splitLayout}>
              <div
                ref={viewportRef}
                className={styles.previewArea}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
              >
                {renderError ? (
                  <div className={styles.errorBox}>{renderError}</div>
                ) : isRendering ? (
                  <div className={styles.loadingBox}>Renderizando diagrama...</div>
                ) : (
                  <div
                    className={styles.svgCanvas}
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: 'center center',
                    }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                )}
              </div>
              <textarea
                className={`${styles.codeArea} ${styles.splitCode}`}
                value={umlCode}
                onChange={handleCodeChange}
                onMouseDown={stopProp}
                onClick={stopProp}
                placeholder="Escribí tu diagrama Mermaid acá..."
              />
            </div>
          ) : activeTab === 'preview' ? (
            <div
              ref={viewportRef}
              className={styles.previewArea}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
            >
              {renderError ? (
                <div className={styles.errorBox}>{renderError}</div>
              ) : isRendering ? (
                <div className={styles.loadingBox}>Renderizando diagrama...</div>
              ) : (
                <div
                  className={styles.svgCanvas}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              )}
            </div>
          ) : (
            <textarea
              className={styles.codeArea}
              value={umlCode}
              onChange={handleCodeChange}
              onMouseDown={stopProp}
              onClick={stopProp}
              placeholder="Escribí tu diagrama Mermaid acá..."
            />
          )}
        </div>

        {printSvgContent && (
          <div
            className={styles.printWrapper}
            dangerouslySetInnerHTML={{ __html: printSvgContent }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className={styles.umlContainer}
      contentEditable={false}
      onMouseDown={stopProp}
      onClick={stopProp}
    >
      <div className={styles.screenWrapper}>
        <div className={styles.umlHeader}>
          <div className={styles.headerLeft}>
            <GitGraph size={14} color="var(--accent-purple)" />
            <span className={styles.headerTitle}>Diagrama UML</span>
            <div className={styles.presetsWrapper} ref={presetsRef}>
              <button
                type="button"
                className={styles.presetsBtn}
                onMouseDown={eatMouseDown}
                onClick={(e) => { e.stopPropagation(); setShowPresets((v) => !v); }}
                title="Plantillas"
              >
                Plantillas <ChevronDown size={11} />
              </button>
              {showPresets && (
                <div className={styles.presetsDropdown}>
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={styles.presetItem}
                      onMouseDown={eatMouseDown}
                      onClick={(e) => { e.stopPropagation(); applyPreset(p); }}
                    >
                      {p.label}
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
              onMouseDown={eatMouseDown}
              onClick={(e) => { e.stopPropagation(); setActiveTab('preview'); }}
            >
              <Eye size={12} />
              <span>Vista Previa</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'split' ? styles.active : ''}`}
              onMouseDown={eatMouseDown}
              onClick={(e) => { e.stopPropagation(); setActiveTab('split'); }}
            >
              <Columns size={12} />
              <span>Split</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'code' ? styles.active : ''}`}
              onMouseDown={eatMouseDown}
              onClick={(e) => { e.stopPropagation(); setActiveTab('code'); }}
            >
              <Code size={12} />
              <span>Código</span>
            </button>
          </div>

          <div className={styles.headerRight}>
            <div
              className={styles.zoomControls}
              style={{
                visibility: (activeTab === 'preview' || activeTab === 'split') && !isRendering && !renderError
                  ? 'visible' : 'hidden',
                pointerEvents: (activeTab === 'preview' || activeTab === 'split') && !isRendering && !renderError
                  ? 'auto' : 'none',
              }}
            >
              <button type="button" className={styles.actionBtn} onMouseDown={eatMouseDown} onClick={zoomOut} title="Alejar">
                <ZoomOut size={12} />
              </button>
              <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
              <button type="button" className={styles.actionBtn} onMouseDown={eatMouseDown} onClick={zoomIn} title="Acercar">
                <ZoomIn size={12} />
              </button>
              <button type="button" className={styles.actionBtn} onMouseDown={eatMouseDown} onClick={resetView} title="Restablecer vista">
                <Maximize2 size={12} />
              </button>
            </div>
            {onDelete && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onMouseDown={eatMouseDown}
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                title="Eliminar diagrama"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {activeTab === 'split' ? (
          <div className={styles.splitLayout}>
            <div
              ref={viewportRef}
              className={styles.previewArea}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
            >
              {renderError ? (
                <div className={styles.errorBox}>{renderError}</div>
              ) : isRendering ? (
                <div className={styles.loadingBox}>Renderizando diagrama...</div>
              ) : (
                <div
                  className={styles.svgCanvas}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              )}
            </div>
            <textarea
              className={`${styles.codeArea} ${styles.splitCode}`}
              value={umlCode}
              onChange={handleCodeChange}
              onMouseDown={stopProp}
              onClick={stopProp}
              placeholder="Escribí tu diagrama Mermaid acá..."
            />
          </div>
        ) : activeTab === 'preview' ? (
          <div
            ref={viewportRef}
            className={styles.previewArea}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
          >
            {renderError ? (
              <div className={styles.errorBox}>{renderError}</div>
            ) : isRendering ? (
              <div className={styles.loadingBox}>Renderizando diagrama...</div>
            ) : (
              <div
                className={styles.svgCanvas}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            )}
          </div>
        ) : (
          <textarea
            className={styles.codeArea}
            value={umlCode}
            onChange={handleCodeChange}
            onMouseDown={stopProp}
            onClick={stopProp}
            placeholder="Escribí tu diagrama Mermaid acá..."
          />
        )}
      </div>

      {printSvgContent && (
        <div
          className={styles.printWrapper}
          dangerouslySetInnerHTML={{ __html: printSvgContent }}
        />
      )}
    </div>
  );
};
