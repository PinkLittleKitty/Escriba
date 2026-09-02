import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Network,
  X,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Play,
  Pause,
  Layers,
  Filter,
  Eye,
  EyeOff,
  ExternalLink,
  BookOpen,
  FileText
} from 'lucide-react';
import { useNotesStore } from '../../store/useNotesStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import styles from './KnowledgeGraphModal.module.css';

export const KnowledgeGraphModal = () => {
  const subjects = useNotesStore((state) => state.subjects);
  const setActiveNote = useNotesStore((state) => state.setActiveNote);
  const closeModal = useUIStore((state) => state.closeModal);
  const addToast = useUIStore((state) => state.addToast);

  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [showLabels, setShowLabels] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const [hideOrphans, setHideOrphans] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  const isDraggingCanvas = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const draggedNode = useRef(null);
  const animFrameId = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);

  useEffect(() => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 650;
    const cx = width / 2;
    const cy = height / 2;

    const activeSubjects = subjects.filter((s) => !s.archived);
    const newNodes = [];
    const newLinks = [];
    const noteMap = new Map();
    const subjectMap = new Map();

    const hubRadius = Math.min(width, height) * 0.28;

    activeSubjects.forEach((sub, sIdx) => {
      const angle = (sIdx / Math.max(activeSubjects.length, 1)) * Math.PI * 2;
      const sNode = {
        id: `sub-${sub.id}`,
        rawId: sub.id,
        type: 'subject',
        title: sub.name,
        color: sub.color || '#4361ee',
        radius: 22,
        x: cx + Math.cos(angle) * hubRadius + (Math.random() - 0.5) * 20,
        y: cy + Math.sin(angle) * hubRadius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        degree: 0
      };
      newNodes.push(sNode);
      subjectMap.set(sub.id, sNode);

      (sub.notes || []).forEach((note, nIdx) => {
        const noteAngle = angle + (Math.random() - 0.5) * 0.8;
        const noteDist = hubRadius + 60 + Math.random() * 70;
        const nNode = {
          id: `note-${note.id}`,
          rawId: note.id,
          subjectId: sub.id,
          subjectName: sub.name,
          type: 'note',
          title: note.title || 'Sin título',
          color: sub.color || '#4361ee',
          tags: note.tags || [],
          contentLength: (note.content || '').length,
          radius: 12,
          x: cx + Math.cos(noteAngle) * noteDist,
          y: cy + Math.sin(noteAngle) * noteDist,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
          degree: 0,
          inboundLinks: 0,
          outboundLinks: 0
        };
        newNodes.push(nNode);
        noteMap.set(note.id, nNode);

        newLinks.push({
          source: sNode.id,
          target: nNode.id,
          type: 'hierarchy'
        });
        sNode.degree++;
        nNode.degree++;
      });
    });

    activeSubjects.forEach((sub) => {
      (sub.notes || []).forEach((note) => {
        const sourceNode = noteMap.get(note.id);
        if (!sourceNode || !note.content) return;

        const idMatches = note.content.matchAll(/data-note-id="([^"]+)"/g);
        for (const m of idMatches) {
          const targetId = m[1];
          if (targetId && targetId !== note.id && noteMap.has(targetId)) {
            const targetNode = noteMap.get(targetId);
            newLinks.push({
              source: sourceNode.id,
              target: `note-${targetId}`,
              type: 'reference'
            });
            sourceNode.degree++;
            sourceNode.outboundLinks++;
            targetNode.degree++;
            targetNode.inboundLinks++;
          }
        }

        const titleMatches = note.content.matchAll(/\[\[(.*?)\]\]/g);
        for (const tm of titleMatches) {
          const rawTitle = tm[1]?.trim().toLowerCase();
          if (rawTitle) {
            for (const [, nNode] of noteMap) {
              if (nNode.rawId !== note.id && nNode.title.toLowerCase() === rawTitle) {
                newLinks.push({
                  source: sourceNode.id,
                  target: nNode.id,
                  type: 'reference'
                });
                sourceNode.degree++;
                sourceNode.outboundLinks++;
                nNode.degree++;
                nNode.inboundLinks++;
                break;
              }
            }
          }
        }
      });
    });

    newNodes.forEach((n) => {
      if (n.type === 'note') {
        n.radius = Math.min(24, Math.max(10, 10 + n.degree * 2.2));
      }
    });

    nodesRef.current = newNodes;
    linksRef.current = newLinks;
    setNodes([...newNodes]);
    setLinks([...newLinks]);
  }, [subjects]);

  useEffect(() => {
    if (!isSimulating) return;

    let iteration = 0;
    const maxIterations = 350;

    const simulate = () => {
      const currentNodes = nodesRef.current;
      const currentLinks = linksRef.current;
      if (!currentNodes.length) return;

      const kRepulsion = 1400;
      const kSpring = 0.045;
      const damping = 0.88;
      const centerGravity = 0.015;
      const width = containerRef.current?.clientWidth || 900;
      const height = containerRef.current?.clientHeight || 650;
      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < currentNodes.length; i++) {
        const n1 = currentNodes[i];
        for (let j = i + 1; j < currentNodes.length; j++) {
          const n2 = currentNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const minSafeDist = n1.radius + n2.radius + 15;
          const distSq = Math.max(minSafeDist * minSafeDist, dx * dx + dy * dy);
          const dist = Math.sqrt(distSq);
          const force = kRepulsion / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (n1.fx === null) {
            n1.vx -= fx;
            n1.vy -= fy;
          }
          if (n2.fx === null) {
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      const nodeById = new Map(currentNodes.map((n) => [n.id, n]));
      for (const link of currentLinks) {
        const src = nodeById.get(link.source);
        const tgt = nodeById.get(link.target);
        if (!src || !tgt) continue;

        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = link.type === 'reference' ? 75 : 110;
        const force = (dist - targetDist) * kSpring;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (src.fx === null) {
          src.vx += fx;
          src.vy += fy;
        }
        if (tgt.fx === null) {
          tgt.vx -= fx;
          tgt.vy -= fy;
        }
      }

      for (const node of currentNodes) {
        if (node.fx !== null && node.fy !== null) {
          node.x = node.fx;
          node.y = node.fy;
          node.vx = 0;
          node.vy = 0;
          continue;
        }

        const gx = (cx - node.x) * centerGravity;
        const gy = (cy - node.y) * centerGravity;
        node.vx = (node.vx + gx) * damping;
        node.vy = (node.vy + gy) * damping;

        node.x += node.vx;
        node.y += node.vy;
      }

      iteration++;
      setNodes([...currentNodes]);

      if (iteration < maxIterations || draggedNode.current) {
        animFrameId.current = requestAnimationFrame(simulate);
      }
    };

    animFrameId.current = requestAnimationFrame(simulate);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isSimulating]);

  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.type === 'subject' && !showHubs) return false;
      if (selectedSubjectFilter !== 'all') {
        if (n.type === 'subject' && n.rawId !== selectedSubjectFilter) return false;
        if (n.type === 'note' && n.subjectId !== selectedSubjectFilter) return false;
      }
      if (hideOrphans && n.type === 'note' && n.inboundLinks === 0 && n.outboundLinks === 0) {
        return false;
      }
      return true;
    });
  }, [nodes, showHubs, selectedSubjectFilter, hideOrphans]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleLinks = useMemo(() => {
    return links.filter((l) => visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target));
  }, [links, visibleNodeIds]);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const handleNodeClick = (node, e) => {
    e.stopPropagation();
    setSelectedNode(node);
    if (node.type === 'note') {
      setActiveNote(node.subjectId, node.rawId);
      addToast({ message: `Abriendo apunte "${node.title}"`, type: 'info' });
      closeModal();
    } else if (node.type === 'subject') {
      const sub = subjects.find((s) => s.id === node.rawId);
      if (sub && sub.notes && sub.notes.length > 0) {
        setActiveNote(sub.id, sub.notes[0].id);
        addToast({ message: `Abriendo materia "${sub.name}"`, type: 'info' });
        closeModal();
      }
    }
  };

  const handleMouseDownNode = (node, e) => {
    e.stopPropagation();
    draggedNode.current = node;
    node.fx = node.x;
    node.fy = node.y;
    setIsSimulating(true);
  };

  const handleMouseDownCanvas = (e) => {
    if (e.button !== 0) return;
    isDraggingCanvas.current = true;
    dragStart.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y
    };
  };

  const handleMouseMove = (e) => {
    if (draggedNode.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - transform.x) / transform.k;
      const mouseY = (e.clientY - rect.top - transform.y) / transform.k;
      draggedNode.current.fx = mouseX;
      draggedNode.current.fy = mouseY;
      draggedNode.current.x = mouseX;
      draggedNode.current.y = mouseY;
      setNodes([...nodesRef.current]);
      return;
    }

    if (isDraggingCanvas.current) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      }));
    }
  };

  const handleMouseUp = () => {
    if (draggedNode.current) {
      draggedNode.current.fx = null;
      draggedNode.current.fy = null;
      draggedNode.current = null;
    }
    isDraggingCanvas.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newK = Math.max(0.25, Math.min(3.5, transform.k * zoomFactor));

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - transform.x) * (newK / transform.k);
    const newY = mouseY - (mouseY - transform.y) * (newK / transform.k);

    setTransform({ x: newX, y: newY, k: newK });
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  const fitToScreen = () => {
    if (!visibleNodes.length || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    visibleNodes.forEach((n) => {
      minX = Math.min(minX, n.x - n.radius);
      maxX = Math.max(maxX, n.x + n.radius);
      minY = Math.min(minY, n.y - n.radius);
      maxY = Math.max(maxY, n.y + n.radius);
    });

    const graphWidth = maxX - minX + 100;
    const graphHeight = maxY - minY + 100;
    const scale = Math.min(width / graphWidth, height / graphHeight, 1.5);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setTransform({
      x: width / 2 - midX * scale,
      y: height / 2 - midY * scale,
      k: scale
    });
  };

  const matchesSearch = (title) => {
    if (!searchTerm.trim()) return true;
    return title.toLowerCase().includes(searchTerm.toLowerCase().trim());
  };

  const isConnectedToHovered = (nodeId) => {
    if (!hoveredNode) return true;
    if (nodeId === hoveredNode.id) return true;
    return visibleLinks.some(
      (l) =>
        (l.source === hoveredNode.id && l.target === nodeId) ||
        (l.target === hoveredNode.id && l.source === nodeId)
    );
  };

  const activeSubjectsList = subjects.filter((s) => !s.archived);

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <h3 className={styles.modalTitle}>
              <Network size={20} color="var(--accent-blue)" />
              <span>Minimapa</span>
            </h3>
            <span className={styles.statsBadge}>
              {visibleNodes.filter((n) => n.type === 'note').length} apuntes ·{' '}
              {visibleLinks.filter((l) => l.type === 'reference').length} enlaces internos
            </span>
          </div>

          <div className={styles.headerActions}>
            <select
              className={styles.selectFilter}
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              title="Filtrar por materia"
            >
              <option value="all">Todas las materias</option>
              {activeSubjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`${styles.toggleBtn} ${showLabels ? styles.toggleBtnActive : ''}`}
              onClick={() => setShowLabels(!showLabels)}
              title="Mostrar u ocultar títulos"
            >
              {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>Etiquetas</span>
            </button>

            <button
              type="button"
              className={`${styles.toggleBtn} ${showHubs ? styles.toggleBtnActive : ''}`}
              onClick={() => setShowHubs(!showHubs)}
              title="Mostrar u ocultar materias centrales"
            >
              <Layers size={14} />
              <span>Materias</span>
            </button>

            <div className={styles.searchBar}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar en el grafo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  onClick={() => setSearchTerm('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button type="button" className={styles.closeBtn} onClick={closeModal} title="Cerrar">
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={styles.graphBody}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg className={styles.graphSvg}>
            <defs>
              <marker
                id="arrowhead-ref"
                markerWidth="8"
                markerHeight="6"
                refX="16"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="var(--accent-blue)" opacity="0.9" />
              </marker>
            </defs>

            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
              {visibleLinks.map((link, idx) => {
                const src = nodeMap.get(link.source);
                const tgt = nodeMap.get(link.target);
                if (!src || !tgt) return null;

                const isDimmed =
                  hoveredNode &&
                  src.id !== hoveredNode.id &&
                  tgt.id !== hoveredNode.id;

                const isRef = link.type === 'reference';

                return (
                  <line
                    key={`link-${idx}`}
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isRef ? 'var(--accent-blue)' : 'var(--border-color)'}
                    strokeWidth={isRef ? 2 : 1}
                    strokeDasharray={isRef ? '4,4' : 'none'}
                    strokeOpacity={isDimmed ? 0.08 : isRef ? 0.9 : 0.3}
                    markerEnd={isRef ? 'url(#arrowhead-ref)' : undefined}
                    style={{ transition: 'stroke-opacity 0.2s ease' }}
                  />
                );
              })}

              {visibleNodes.map((node) => {
                const isMatching = matchesSearch(node.title);
                const isConnected = isConnectedToHovered(node.id);
                const isHovered = hoveredNode?.id === node.id;
                const isHub = node.type === 'subject';

                const opacity = (!isMatching || !isConnected) && !isHovered ? 0.15 : 1;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
                    opacity={opacity}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onMouseDown={(e) => handleMouseDownNode(node, e)}
                    onClick={(e) => handleNodeClick(node, e)}
                  >
                    <circle
                      r={node.radius + (isHovered ? 4 : 0)}
                      fill={isHub ? node.color : 'var(--bg-card)'}
                      stroke={node.color}
                      strokeWidth={isHub ? 3.5 : isHovered ? 2.5 : 2}
                      style={{
                        filter: isHovered || (searchTerm && isMatching)
                          ? `drop-shadow(0 0 10px ${node.color})`
                          : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    />

                    {isHub && (
                      <circle
                        r={node.radius - 6}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        opacity={0.5}
                      />
                    )}

                    {showLabels && (
                      <text
                        dy={node.radius + 14}
                        textAnchor="middle"
                        fill={isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'}
                        fontSize={isHub ? '12px' : '10.5px'}
                        fontWeight={isHub ? '700' : '500'}
                        style={{
                          pointerEvents: 'none',
                          textShadow: '0 2px 4px rgba(0,0,0,0.85)'
                        }}
                      >
                        {node.title.length > 24 ? `${node.title.slice(0, 22)}...` : node.title}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {hoveredNode && (
            <div className={styles.nodeCard}>
              <div className={styles.nodeCardSub}>
                {hoveredNode.type === 'subject' ? (
                  <>
                    <BookOpen size={13} color={hoveredNode.color} />
                    <span>Materia</span>
                  </>
                ) : (
                  <>
                    <FileText size={13} color={hoveredNode.color} />
                    <span>{hoveredNode.subjectName}</span>
                  </>
                )}
              </div>
              <h4 className={styles.nodeCardTitle}>{hoveredNode.title}</h4>
              <div className={styles.nodeCardStats}>
                {hoveredNode.type === 'note' ? (
                  <span>
                    {hoveredNode.inboundLinks + hoveredNode.outboundLinks} conexiones (
                    {hoveredNode.inboundLinks} entrantes, {hoveredNode.outboundLinks} salientes)
                  </span>
                ) : (
                  <span>{hoveredNode.degree} apuntes asociados</span>
                )}
              </div>
              <button
                type="button"
                className={styles.nodeCardBtn}
                onClick={(e) => handleNodeClick(hoveredNode, e)}
              >
                Abrir en el editor
              </button>
            </div>
          )}

          <div className={styles.controlsPanel}>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => setTransform((t) => ({ ...t, k: Math.min(3.5, t.k * 1.2) }))}
              title="Acercar (+)"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => setTransform((t) => ({ ...t, k: Math.max(0.25, t.k * 0.8) }))}
              title="Alejar (-)"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={fitToScreen}
              title="Ajustar a la pantalla"
            >
              <Maximize2 size={15} />
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={resetView}
              title="Restablecer vista"
            >
              <RotateCcw size={15} />
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => setIsSimulating(!isSimulating)}
              title={isSimulating ? 'Pausar física' : 'Reanudar física'}
            >
              {isSimulating ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>

          <div className={styles.legendPanel}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: 'var(--accent-blue)', border: '2px solid #fff' }} />
              <span>Materia (Hub central)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: 'var(--bg-card)', border: '2px solid var(--accent-blue)' }} />
              <span>Apunte</span>
            </div>
            <div className={styles.legendItem}>
              <span style={{ width: 14, height: 2, background: 'var(--accent-blue)', borderTop: '2px dashed var(--accent-blue)' }} />
              <span>Enlace interno [[...]]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
