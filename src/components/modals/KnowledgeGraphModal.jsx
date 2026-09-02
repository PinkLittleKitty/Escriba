import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Network,
  X,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  const [hoveredNode, setHoveredNode] = useState(null);
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
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const activeSubjects = subjects.filter((s) => !s.archived);
    const newNodes = [];
    const newLinks = [];
    const noteMap = new Map();
    const subjectMap = new Map();

    const cx = width / 2;
    const cy = height / 2;
    const hubRadius = Math.min(width, height) * 0.28;

    activeSubjects.forEach((sub, sIdx) => {
      const angle = (sIdx / Math.max(activeSubjects.length, 1)) * Math.PI * 2;
      const sNode = {
        id: `sub-${sub.id}`,
        rawId: sub.id,
        type: 'subject',
        title: sub.name,
        color: sub.color || '#4361ee',
        radius: 20,
        x: cx + Math.cos(angle) * hubRadius + (Math.random() - 0.5) * 20,
        y: cy + Math.sin(angle) * hubRadius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null
      };
      newNodes.push(sNode);
      subjectMap.set(sub.id, sNode);

      (sub.notes || []).forEach((note, nIdx) => {
        const noteAngle = angle + (Math.random() - 0.5) * 0.8;
        const noteDist = hubRadius + 50 + Math.random() * 60;
        const nNode = {
          id: `note-${note.id}`,
          rawId: note.id,
          subjectId: sub.id,
          type: 'note',
          title: note.title || 'Sin título',
          color: sub.color || '#4361ee',
          radius: 12,
          x: cx + Math.cos(noteAngle) * noteDist,
          y: cy + Math.sin(noteAngle) * noteDist,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null
        };
        newNodes.push(nNode);
        noteMap.set(note.id, nNode);

        newLinks.push({
          source: sNode.id,
          target: nNode.id,
          type: 'hierarchy'
        });
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
            newLinks.push({
              source: sourceNode.id,
              target: `note-${targetId}`,
              type: 'reference'
            });
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
                break;
              }
            }
          }
        }
      });
    });

    nodesRef.current = newNodes;
    linksRef.current = newLinks;
    setNodes([...newNodes]);
    setLinks([...newLinks]);
  }, [subjects]);

  useEffect(() => {
    let iteration = 0;
    const maxIterations = 350;

    const simulate = () => {
      const currentNodes = nodesRef.current;
      const currentLinks = linksRef.current;
      if (!currentNodes.length) return;

      const kRepulsion = 1200;
      const kSpring = 0.04;
      const damping = 0.88;
      const centerGravity = 0.015;
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;
      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < currentNodes.length; i++) {
        const n1 = currentNodes[i];
        for (let j = i + 1; j < currentNodes.length; j++) {
          const n2 = currentNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy + 100;
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
        const targetDist = link.type === 'reference' ? 70 : 100;
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
  }, []);

  const handleNodeClick = (node, e) => {
    e.stopPropagation();
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
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newK = Math.max(0.3, Math.min(3, transform.k * zoomFactor));

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

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const matchesSearch = (title) => {
    if (!searchTerm.trim()) return true;
    return title.toLowerCase().includes(searchTerm.toLowerCase().trim());
  };

  const isConnectedToHovered = (nodeId) => {
    if (!hoveredNode) return true;
    if (nodeId === hoveredNode.id) return true;
    return links.some(
      (l) =>
        (l.source === hoveredNode.id && l.target === nodeId) ||
        (l.target === hoveredNode.id && l.source === nodeId)
    );
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <h3 className={styles.modalTitle}>
              <Network size={20} color="var(--accent-blue)" />
              <span>Grafo de Conocimiento</span>
            </h3>
            <span className={styles.statsBadge}>
              {nodes.filter((n) => n.type === 'note').length} apuntes ·{' '}
              {nodes.filter((n) => n.type === 'subject').length} materias
            </span>
          </div>

          <div className={styles.headerActions}>
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
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
                refX="18"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="var(--accent-blue)" opacity="0.8" />
              </marker>
            </defs>

            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
              {links.map((link, idx) => {
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
                    stroke={isRef ? 'var(--accent-blue)' : 'var(--border-light, #444)'}
                    strokeWidth={isRef ? 1.8 : 1}
                    strokeDasharray={isRef ? '3,3' : 'none'}
                    strokeOpacity={isDimmed ? 0.1 : isRef ? 0.85 : 0.35}
                    markerEnd={isRef ? 'url(#arrowhead-ref)' : undefined}
                    style={{ transition: 'stroke-opacity 0.2s ease' }}
                  />
                );
              })}

              {nodes.map((node) => {
                const isMatching = matchesSearch(node.title);
                const isConnected = isConnectedToHovered(node.id);
                const isHovered = hoveredNode?.id === node.id;
                const isHub = node.type === 'subject';

                const opacity = (!isMatching || !isConnected) && !isHovered ? 0.2 : 1;

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
                      r={node.radius + (isHovered ? 3 : 0)}
                      fill={isHub ? node.color : 'var(--bg-card)'}
                      stroke={node.color}
                      strokeWidth={isHub ? 3 : 2}
                      style={{
                        filter: isHovered || (searchTerm && isMatching)
                          ? `drop-shadow(0 0 8px ${node.color})`
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
                        opacity={0.4}
                      />
                    )}

                    <text
                      dy={node.radius + 14}
                      textAnchor="middle"
                      fill={isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'}
                      fontSize={isHub ? '12px' : '10.5px'}
                      fontWeight={isHub ? '700' : '500'}
                      style={{
                        pointerEvents: 'none',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      {node.title.length > 22 ? `${node.title.slice(0, 20)}...` : node.title}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className={styles.controlsPanel}>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => setTransform((t) => ({ ...t, k: Math.min(3, t.k * 1.2) }))}
              title="Acercar (+)"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => setTransform((t) => ({ ...t, k: Math.max(0.3, t.k * 0.8) }))}
              title="Alejar (-)"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={resetView}
              title="Centrar vista"
            >
              <RotateCcw size={15} />
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
