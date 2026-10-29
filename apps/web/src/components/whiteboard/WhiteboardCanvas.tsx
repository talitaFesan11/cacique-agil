'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  CanvasElement,
  PredefinedWhiteboardTemplateDto,
  RealtimeUserPresence,
  TaskDto,
  TaskPriority,
  WhiteboardDto,
} from '@fluxo/shared';
import { whiteboardsApi } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';
import { WhiteboardProviderStatus, WhiteboardYjsSocketProvider } from '@/lib/whiteboard-yjs-provider';
import { WhiteboardStickyNote } from './WhiteboardStickyNote';
import { WhiteboardShape } from './WhiteboardShape';
import { WhiteboardTaskCard } from './WhiteboardTaskCard';
import { WhiteboardConnector } from './WhiteboardConnector';
import { WhiteboardDrawing } from './WhiteboardDrawing';
import { ToolMode, WhiteboardToolbar } from './WhiteboardToolbar';
import { WhiteboardPresenceBar } from './WhiteboardPresenceBar';
import { WhiteboardTaskDrawer } from './WhiteboardTaskDrawer';
import { WhiteboardTemplatesModal } from './WhiteboardTemplatesModal';
import { WhiteboardExportMenu } from './WhiteboardExportMenu';
import styles from './whiteboard.module.css';

interface RemoteCursorInfo {
  x: number;
  y: number;
  userName: string;
  userColor: string;
}

interface WhiteboardCanvasProps {
  whiteboard: WhiteboardDto;
  projectTasks?: TaskDto[];
  onOpenTaskDetail?: (taskId: string) => void;
  onTitleChange?: (newTitle: string) => void;
  readOnly?: boolean;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  whiteboard,
  projectTasks = [],
  onOpenTaskDetail,
  onTitleChange: _onTitleChange,
  readOnly = false,
}) => {
  const currentUser = useAuthStore((s) => s.user);

  // Estados do Canvas
  const [elements, setElements] = useState<CanvasElement[]>(whiteboard.elementsJson || []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentMode, setCurrentMode] = useState<ToolMode>('select');

  // Câmera (Pan & Zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Estados de Tempo Real (Yjs & Socket.IO)
  const [syncStatus, setSyncStatus] = useState<WhiteboardProviderStatus>('connecting');
  const [activeUsers, setActiveUsers] = useState<RealtimeUserPresence[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Map<number, RemoteCursorInfo>>(new Map());

  // Diálogos e Gavetas
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<PredefinedWhiteboardTemplateDto[]>([]);

  // Refs de interação do mouse
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingCanvasRef = useRef(false);
  const isDraggingElementRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const elementStartPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const currentDrawPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Seta em andamento
  const [arrowDraft, setArrowDraft] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);

  // Provedor Yjs sobre Socket.IO
  const provider = useMemo(() => {
    return new WhiteboardYjsSocketProvider(whiteboard.id);
  }, [whiteboard.id]);

  useEffect(() => {
    setElements(whiteboard.elementsJson || []);
  }, [whiteboard.id, whiteboard.elementsJson]);

  // Carrega templates pré-definidos
  useEffect(() => {
    whiteboardsApi.getTemplates().then(setAvailableTemplates).catch(() => {});
  }, []);

  // Configura sincronização em tempo real e awareness
  useEffect(() => {
    const unsubStatus = provider.onStatusChange(setSyncStatus);
    const unsubPresence = provider.onPresenceChange(setActiveUsers);

    // Awareness remoto (cursores de outros usuários)
    const onAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const newCursors = new Map<number, RemoteCursorInfo>();

      states.forEach((state, clientId) => {
        if (clientId === provider.doc.clientID) return;
        if (state.cursor && state.user) {
          newCursors.set(clientId, {
            x: state.cursor.x,
            y: state.cursor.y,
            userName: state.user.name,
            userColor: state.user.color || '#6366f1',
          });
        }
      });

      setRemoteCursors(newCursors);
    };

    provider.awareness.on('change', onAwarenessChange);

    // Configura awareness local
    if (currentUser) {
      provider.awareness.setLocalStateField('user', {
        name: currentUser.name,
        color: stringToColor(currentUser.name),
      });
    }

    return () => {
      unsubStatus();
      unsubPresence();
      provider.awareness.off('change', onAwarenessChange);
      provider.destroy();
    };
  }, [provider, currentUser]);

  // Transforma coordenada de tela para coordenada virtual do canvas
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - pan.x) / zoom;
      const y = (screenY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom],
  );

  // Salva no banco de forma persistente com debounce
  const persistElements = useCallback(
    (newElements: CanvasElement[]) => {
      setElements(newElements);
      whiteboardsApi.update(whiteboard.id, {
        elementsJson: newElements,
      }).catch(() => {});
    },
    [whiteboard.id],
  );

  // Zoom handlers
  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setZoom((prevZoom) => {
      const newZoom = Math.min(3, Math.max(0.2, prevZoom + delta));
      if (centerX !== undefined && centerY !== undefined && containerRef.current) {
        const factor = newZoom / prevZoom;
        setPan((prevPan) => ({
          x: centerX - (centerX - prevPan.x) * factor,
          y: centerY - (centerY - prevPan.y) * factor,
        }));
      }
      return Number(newZoom.toFixed(2));
    });
  }, []);

  const handleZoomIn = () => handleZoom(0.15);
  const handleZoomOut = () => handleZoom(-0.15);
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel event para Pan e Zoom suave
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = -e.deltaY * 0.0015;
      handleZoom(zoomFactor, e.clientX, e.clientY);
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Pointer Down (Iniciar interação)
  const handlePointerDown = (e: React.PointerEvent) => {
    const coords = screenToCanvas(e.clientX, e.clientY);

    // 1. Pan se modo pan ou botão do meio
    if (currentMode === 'pan' || e.button === 1) {
      isDraggingCanvasRef.current = true;
      dragStartPosRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    // 2. Desenho livre
    if (currentMode === 'draw') {
      currentDrawPointsRef.current = [coords];
      return;
    }

    // 3. Seta conectora
    if (currentMode === 'arrow') {
      setArrowDraft({ start: coords, end: coords });
      return;
    }

    // 4. Criação de novo elemento com clique
    if (['sticky', 'rectangle', 'ellipse', 'diamond', 'frame'].includes(currentMode)) {
      const newId = `el-${Date.now()}`;
      let newElement: CanvasElement;

      if (currentMode === 'sticky') {
        newElement = {
          id: newId,
          type: 'sticky',
          x: coords.x - 100,
          y: coords.y - 90,
          width: 200,
          height: 180,
          text: '',
          backgroundColor: '#fef08a',
          color: '#854d0e',
          zIndex: elements.length + 1,
        };
      } else if (currentMode === 'frame') {
        newElement = {
          id: newId,
          type: 'frame',
          x: coords.x - 160,
          y: coords.y - 150,
          width: 320,
          height: 480,
          text: 'Nova Moldura',
          zIndex: 0,
        };
      } else {
        newElement = {
          id: newId,
          type: 'shape',
          shapeType: currentMode as 'rectangle' | 'ellipse' | 'diamond',
          x: coords.x - 90,
          y: coords.y - 50,
          width: 180,
          height: 100,
          text: '',
          backgroundColor: '#e0e7ff',
          color: '#3730a3',
          zIndex: elements.length + 1,
        };
      }

      const updated = [...elements, newElement];
      persistElements(updated);
      setSelectedIds([newId]);
      setCurrentMode('select');
      return;
    }

    // 5. Clique no fundo limpa seleção
    const containerClass = styles.canvasContainer;
    if (containerClass && (e.target as HTMLElement).classList.contains(containerClass)) {
      setSelectedIds([]);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = screenToCanvas(e.clientX, e.clientY);

    // Atualiza awareness com cursor local
    provider.awareness.setLocalStateField('cursor', {
      x: coords.x,
      y: coords.y,
    });

    if (isDraggingCanvasRef.current) {
      setPan({
        x: e.clientX - dragStartPosRef.current.x,
        y: e.clientY - dragStartPosRef.current.y,
      });
      return;
    }

    if (currentMode === 'draw' && currentDrawPointsRef.current.length > 0) {
      currentDrawPointsRef.current.push(coords);
      return;
    }

    if (currentMode === 'arrow' && arrowDraft) {
      setArrowDraft({
        ...arrowDraft,
        end: coords,
      });
      return;
    }

    if (isDraggingElementRef.current && selectedIds.length > 0) {
      const deltaX = coords.x - dragStartPosRef.current.x;
      const deltaY = coords.y - dragStartPosRef.current.y;

      setElements((prev) =>
        prev.map((el) => {
          if (selectedIds.includes(el.id)) {
            const start = elementStartPosRef.current.get(el.id);
            if (start) {
              return {
                ...el,
                x: Math.round(start.x + deltaX),
                y: Math.round(start.y + deltaY),
              };
            }
          }
          return el;
        }),
      );
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    isDraggingCanvasRef.current = false;

    if (isDraggingElementRef.current) {
      isDraggingElementRef.current = false;
      persistElements(elements);
    }

    if (currentMode === 'draw' && currentDrawPointsRef.current.length > 1) {
      const newDraw: CanvasElement = {
        id: `draw-${Date.now()}`,
        type: 'draw',
        x: currentDrawPointsRef.current[0]!.x,
        y: currentDrawPointsRef.current[0]!.y,
        width: 100,
        height: 100,
        points: [...currentDrawPointsRef.current],
        color: '#334155',
        strokeWidth: 3,
        zIndex: elements.length + 1,
      };
      persistElements([...elements, newDraw]);
      currentDrawPointsRef.current = [];
      setCurrentMode('select');
    }

    if (currentMode === 'arrow' && arrowDraft) {
      const newArrow: CanvasElement = {
        id: `arrow-${Date.now()}`,
        type: 'arrow',
        x: Math.min(arrowDraft.start.x, arrowDraft.end.x),
        y: Math.min(arrowDraft.start.y, arrowDraft.end.y),
        width: Math.abs(arrowDraft.end.x - arrowDraft.start.x) || 10,
        height: Math.abs(arrowDraft.end.y - arrowDraft.start.y) || 10,
        fromPoint: arrowDraft.start,
        toPoint: arrowDraft.end,
        color: '#6366f1',
        strokeWidth: 3,
        zIndex: elements.length + 1,
      };
      persistElements([...elements, newArrow]);
      setArrowDraft(null);
      setCurrentMode('select');
    }
  };

  // Interação ao clicar em um elemento do canvas
  const handleElementPointerDown = (e: React.PointerEvent, element: CanvasElement) => {
    e.stopPropagation();
    if (currentMode === 'pan') return;

    if (currentMode === 'select') {
      if (e.shiftKey) {
        setSelectedIds((prev) =>
          prev.includes(element.id) ? prev.filter((id) => id !== element.id) : [...prev, element.id],
        );
      } else {
        if (!selectedIds.includes(element.id)) {
          setSelectedIds([element.id]);
        }
      }

      isDraggingElementRef.current = true;
      const coords = screenToCanvas(e.clientX, e.clientY);
      dragStartPosRef.current = coords;

      const map = new Map<string, { x: number; y: number }>();
      elements.forEach((el) => {
        map.set(el.id, { x: el.x, y: el.y });
      });
      elementStartPosRef.current = map;
    }
  };

  // Atualização de propriedades do elemento
  const handleUpdateElement = (id: string, updated: Partial<CanvasElement>) => {
    const nextElements = elements.map((el) => (el.id === id ? { ...el, ...updated } : el));
    persistElements(nextElements);
  };

  // Exclusão de elemento
  const handleDeleteElement = (id: string) => {
    const nextElements = elements.filter((el) => el.id !== id);
    persistElements(nextElements);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  // Atalhos de teclado (Delete, Duplicar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        const next = elements.filter((el) => !selectedIds.includes(el.id));
        persistElements(next);
        setSelectedIds([]);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedIds.length > 0) {
        e.preventDefault();
        const duplicates: CanvasElement[] = [];
        const newSelectedIds: string[] = [];

        elements.forEach((el) => {
          if (selectedIds.includes(el.id)) {
            const dupId = `dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            duplicates.push({
              ...el,
              id: dupId,
              x: el.x + 30,
              y: el.y + 30,
            });
            newSelectedIds.push(dupId);
          }
        });

        persistElements([...elements, ...duplicates]);
        setSelectedIds(newSelectedIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedIds, persistElements]);

  // Conversão de post-it em tarefa real
  const handleConvertToTask = async (sticky: CanvasElement) => {
    if (!whiteboard.projectId) {
      alert('Vincule o quadro a um projeto para converter notas em tarefas.');
      return;
    }

    try {
      const res = await whiteboardsApi.convertSticky(whiteboard.id, {
        stickyId: sticky.id,
        projectId: whiteboard.projectId,
        title: sticky.text,
        priority: TaskPriority.NONE,
      });

      setElements((prev) =>
        prev.map((el) => (el.id === sticky.id ? res.element : el)),
      );
    } catch {
      alert('Falha ao converter nota em tarefa.');
    }
  };

  // Conversão de seleção múltipla em tarefas
  const handleConvertSelection = async () => {
    if (!whiteboard.projectId) {
      alert('Vincule o quadro a um projeto para converter notas em tarefas.');
      return;
    }

    const stickies = elements.filter((el) => selectedIds.includes(el.id) && el.type === 'sticky');
    if (stickies.length === 0) return;

    try {
      const res = await whiteboardsApi.convertSelection(whiteboard.id, {
        stickyIds: stickies.map((s) => s.id),
        projectId: whiteboard.projectId,
      });

      const updatedMap = new Map(res.elements.map((e) => [e.id, e]));
      setElements((prev) => prev.map((el) => updatedMap.get(el.id) || el));
    } catch {
      alert('Falha ao converter seleção de notas em tarefas.');
    }
  };

  // Inserir tarefa do projeto no canvas
  const handleAddTaskToCanvas = async (task: TaskDto) => {
    // Calcula posição central da câmera
    const center = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);

    const newCard: CanvasElement = {
      id: `task-${task.id}`,
      type: 'task_card',
      x: Math.round(center.x - 140),
      y: Math.round(center.y - 70),
      width: 280,
      height: 140,
      taskId: task.id,
      taskKey: task.key,
      taskTitle: task.title,
      taskPriority: task.priority,
      taskStatusName: task.status?.name || 'A Fazer',
      taskStatusCategory: task.status?.category || 'TODO',
      zIndex: elements.length + 1,
    };

    persistElements([...elements, newCard]);
    setSelectedIds([newCard.id]);
    setTaskDrawerOpen(false);
  };

  // Aplicar modelo pré-definido
  const handleSelectTemplate = (template: PredefinedWhiteboardTemplateDto) => {
    const templateElements = JSON.parse(JSON.stringify(template.elements));
    persistElements([...elements, ...templateElements]);
  };

  // Exportações
  const handleExportSvg = async () => {
    try {
      const svgText = await whiteboardsApi.export(whiteboard.id, 'svg');
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${whiteboard.title.replace(/\s+/g, '_')}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Falha ao exportar SVG');
    }
  };

  const handleExportJson = async () => {
    try {
      const jsonText = await whiteboardsApi.export(whiteboard.id, 'json');
      const blob = new Blob([jsonText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${whiteboard.title.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Falha ao exportar JSON');
    }
  };

  const handleExportPng = async () => {
    try {
      const svgText = await whiteboardsApi.export(whiteboard.id, 'svg');
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 1920;
        canvas.height = img.height || 1080;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `${whiteboard.title.replace(/\s+/g, '_')}.png`;
          a.click();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch {
      alert('Falha ao exportar PNG');
    }
  };

  const selectedStickies = elements.filter(
    (el) => selectedIds.includes(el.id) && el.type === 'sticky',
  );

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Barra Superior do Quadro */}
      <Box
        sx={{
          height: 52,
          px: 2,
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          zIndex: 20,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: 17, color: 'text.primary' }}
          >
            {whiteboard.title}
          </Typography>
          {whiteboard.project && (
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Projeto: <strong>{whiteboard.project.name}</strong>
            </span>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WhiteboardPresenceBar status={syncStatus} activeUsers={activeUsers} />
          <WhiteboardExportMenu
            onExportPng={handleExportPng}
            onExportSvg={handleExportSvg}
            onExportJson={handleExportJson}
          />
        </Box>
      </Box>

      {/* Área do Canvas Infinito */}
      <div
        ref={containerRef}
        className={styles.canvasContainer}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          cursor: currentMode === 'pan' ? 'grab' : 'default',
        }}
        data-testid="whiteboard-canvas-area"
      >
        {/* Camada Transformada Virtual */}
        <div
          className={styles.canvasContent}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Conectores e Linhas em Camada SVG de Fundo */}
          <svg
            style={{
              position: 'absolute',
              top: -5000,
              left: -5000,
              width: 10000,
              height: 10000,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            {elements
              .filter((e) => e.type === 'arrow')
              .map((arrow) => (
                <WhiteboardConnector
                  key={arrow.id}
                  element={arrow}
                  allElements={elements}
                  isSelected={selectedIds.includes(arrow.id)}
                />
              ))}

            {elements
              .filter((e) => e.type === 'draw')
              .map((draw) => (
                <WhiteboardDrawing
                  key={draw.id}
                  element={draw}
                  isSelected={selectedIds.includes(draw.id)}
                />
              ))}

            {/* Rascunho visual de seta durante arraste */}
            {arrowDraft && (
              <line
                x1={arrowDraft.start.x}
                y1={arrowDraft.start.y}
                x2={arrowDraft.end.x}
                y2={arrowDraft.end.y}
                stroke="#6366f1"
                strokeWidth={3}
                strokeDasharray="4 4"
              />
            )}
          </svg>

          {/* Renderização de Formas, Frames, Post-its e Tarefas */}
          {elements.map((el) => {
            if (el.type === 'arrow' || el.type === 'draw') return null;

            const isSelected = selectedIds.includes(el.id);

            return (
              <div
                key={el.id}
                className={styles.element}
                style={{
                  transform: `translate(${el.x}px, ${el.y}px)`,
                  width: el.width,
                  height: el.height,
                  zIndex: el.zIndex || 1,
                }}
                onPointerDown={(e) => handleElementPointerDown(e, el)}
              >
                {el.type === 'sticky' && (
                  <WhiteboardStickyNote
                    element={el}
                    isSelected={isSelected}
                    onUpdate={(u) => handleUpdateElement(el.id, u)}
                    onConvertToTask={handleConvertToTask}
                    onDelete={handleDeleteElement}
                    readOnly={readOnly}
                  />
                )}

                {(el.type === 'shape' || el.type === 'frame') && (
                  <WhiteboardShape
                    element={el}
                    isSelected={isSelected}
                    onUpdate={(u) => handleUpdateElement(el.id, u)}
                    readOnly={readOnly}
                  />
                )}

                {el.type === 'task_card' && (
                  <WhiteboardTaskCard
                    element={el}
                    isSelected={isSelected}
                    onOpenTask={(taskId) => onOpenTaskDetail?.(taskId)}
                  />
                )}
              </div>
            );
          })}

          {/* Cursores Remotos com Nome dos Usuários */}
          {Array.from(remoteCursors.entries()).map(([clientId, cur]) => (
            <div
              key={clientId}
              className={styles.remoteCursor}
              style={{
                transform: `translate(${cur.x}px, ${cur.y}px)`,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={cur.userColor}>
                <path d="M0 0 L18 10 L10 12 L7 19 Z" />
              </svg>
              <div className={styles.cursorBadge} style={{ backgroundColor: cur.userColor }}>
                {cur.userName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Ferramentas Flutuante */}
      <WhiteboardToolbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        onOpenTaskDrawer={() => setTaskDrawerOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        zoomLevel={zoom}
        selectedStickyCount={selectedStickies.length}
        onConvertSelection={handleConvertSelection}
        readOnly={readOnly}
      />

      {/* Gaveta de Tarefas do Projeto */}
      <WhiteboardTaskDrawer
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        tasks={projectTasks}
        onAddTaskToCanvas={handleAddTaskToCanvas}
        existingTaskIds={elements.filter((e) => e.taskId).map((e) => e.taskId!)}
      />

      {/* Modal de Modelos Prontos */}
      <WhiteboardTemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        templates={availableTemplates}
        onSelectTemplate={handleSelectTemplate}
      />
    </Box>
  );
};

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
  return colors[Math.abs(hash) % colors.length] || '#6366f1';
}
