'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  addDays,
  DependencyType,
  diffDays,
  GanttTaskItemDto,
  GanttZoomLevel,
  isWeekend,
  parseDate,
  startOfDay,
  toIsoDate,
} from '@fluxo/shared';
import { ganttApi, tasksApi } from '@/lib/api-client';
import { GanttToolbar } from './GanttToolbar';
import { GanttTaskTable } from './GanttTaskTable';
import { GanttTimelineHeader } from './GanttTimelineHeader';
import { GanttGrid } from './GanttGrid';
import { GanttDependencyArrows } from './GanttDependencyArrows';
import { GanttDependencyDialog } from './GanttDependencyDialog';
import { GanttBaselineDialog } from './GanttBaselineDialog';
import styles from './gantt.module.css';

interface TaskGanttViewProps {
  projectId: string;
  canWrite: boolean;
  onOpenTaskDetail: (taskId: string) => void;
}

const COLUMN_WIDTH_MAP: Record<GanttZoomLevel, number> = {
  [GanttZoomLevel.DAY]: 40,
  [GanttZoomLevel.WEEK]: 24,
  [GanttZoomLevel.MONTH]: 12,
  [GanttZoomLevel.QUARTER]: 6,
};

const ROW_HEIGHT = 44;
const CHART_TOP_OFFSET = 18;
const CHART_BOTTOM_OFFSET = 24;

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
  }
}

export function TaskGanttView({
  projectId,
  canWrite,
  onOpenTaskDetail,
}: TaskGanttViewProps) {
  const _t = useTranslations('gantt');
  void _t;
  const queryClient = useQueryClient();

  // Estados locais
  const [zoom, setZoom] = useState<GanttZoomLevel>(GanttZoomLevel.DAY);
  const [highlightCritical, setHighlightCritical] = useState<boolean>(true);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dependencyDialogOpen, setDependencyDialogOpen] = useState(false);
  const [baselineDialogOpen, setBaselineDialogOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [tableCollapsed, setTableCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sincronizar com evento nativo de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (containerRef.current?.requestFullscreen && !document.fullscreenElement) {
          void containerRef.current.requestFullscreen();
        }
      } catch {
        // Fallback gracioso
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          void document.exitFullscreen();
        }
      } catch {
        // Fallback gracioso
      }
    }
  };

  // Fechar tela cheia com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleToggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Referências para sincronização de rolagem
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  // Buscar dados do Gantt
  const { data: ganttData, isLoading, error } = useQuery({
    queryKey: ['gantt', projectId, selectedBaselineId],
    queryFn: () => ganttApi.getGantt(projectId, selectedBaselineId || undefined),
  });

  // Buscar baselines disponíveis
  const { data: baselines = [] } = useQuery({
    queryKey: ['baselines', projectId],
    queryFn: () => ganttApi.getBaselines(projectId),
  });

  const tasks = useMemo(() => ganttData?.tasks || [], [ganttData?.tasks]);
  const dependencies = useMemo(() => ganttData?.dependencies || [], [ganttData?.dependencies]);

  // Calcular intervalo de datas da régua temporal (mínimo 30 dias)
  const { dates, minDate, columnWidth } = useMemo(() => {
    const colWidth = COLUMN_WIDTH_MAP[zoom];
    const today = startOfDay(new Date());

    let min = today;
    let max = addDays(today, 20);

    for (const task of tasks) {
      const s = parseDate(task.startDate);
      const e = parseDate(task.dueDate);
      if (s && s < min) min = s;
      if (e && e > max) max = e;
      const bS = parseDate(task.baselineStartDate);
      const bE = parseDate(task.baselineDueDate);
      if (bS && bS < min) min = bS;
      if (bE && bE > max) max = bE;
    }

    // Adicionar margem de 5 dias antes e 10 dias depois
    const start = addDays(startOfDay(min), -5);
    const end = addDays(startOfDay(max), 15);

    const dateList: Date[] = [];
    let cur = new Date(start);
    while (cur <= end) {
      dateList.push(new Date(cur));
      cur = addDays(cur, 1);
    }

    return { dates: dateList, minDate: start, columnWidth: colWidth };
  }, [tasks, zoom]);

  const totalTimelineWidth = dates.length * columnWidth;
  const totalTimelineHeight = CHART_TOP_OFFSET + tasks.length * ROW_HEIGHT + CHART_BOTTOM_OFFSET;

  // Sincronizar rolagem vertical da linha do tempo com a tabela à esquerda
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Coordenadas calculadas de cada tarefa para barras e setas
  const getTaskCoordinates = (taskId: string) => {
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const task = tasks[index]!;
    const s = parseDate(task.startDate) || parseDate(task.dueDate) || minDate;
    const e = parseDate(task.dueDate) || s;

    const startOffset = Math.max(0, diffDays(minDate, s));
    const duration = task.isMilestone ? 0 : Math.max(1, diffDays(s, e) + 1);

    const xStart = startOffset * columnWidth;
    const width = task.isMilestone ? 22 : Math.max(columnWidth, duration * columnWidth);
    const xEnd = task.isMilestone ? xStart + 22 : xStart + width;
    const yCenter = CHART_TOP_OFFSET + index * ROW_HEIGHT + ROW_HEIGHT / 2;

    return { xStart, xEnd, yCenter, width, index };
  };

  // Manipuladores de Linha de Base
  const handleCreateBaseline = async (name: string, description?: string) => {
    const created = await ganttApi.createBaseline(projectId, { name, description });
    setSelectedBaselineId(created.id);
    await queryClient.invalidateQueries({ queryKey: ['baselines', projectId] });
    await queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    setFeedbackMessage('Linha de base salva com sucesso!');
  };

  const handleDeleteBaseline = async (id: string) => {
    await ganttApi.deleteBaseline(projectId, id);
    if (selectedBaselineId === id) {
      setSelectedBaselineId(null);
    }
    await queryClient.invalidateQueries({ queryKey: ['baselines', projectId] });
    await queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    setFeedbackMessage('Linha de base excluída.');
  };

  // Manipuladores de Dependência
  const handleAddDependency = async (data: {
    predecessorId: string;
    successorId: string;
    type: DependencyType;
    lagDays: number;
  }) => {
    await ganttApi.createDependency(projectId, data);
    await queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    setFeedbackMessage('Dependência adicionada com sucesso!');
  };

  const handleDeleteDependency = async (dep: { id: string }) => {
    await ganttApi.deleteDependency(projectId, dep.id);
    await queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    setFeedbackMessage('Dependência removida.');
  };

  // Auto-reschedule
  const handleAutoReschedule = async () => {
    const result = await ganttApi.autoReschedule(projectId);
    await queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    await queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    setFeedbackMessage(
      result.updatedCount > 0
        ? `${result.updatedCount} tarefas sucessoras foram reagendadas!`
        : 'Todas as tarefas já estão consistentes com suas dependências.',
    );
  };

  // Exportar Gantt como Imagem PNG de Alta Resolução (com tabela, régua de meses/dias, grade e setas)
  const handleExportPng = () => {
    setIsExporting(true);
    try {
      const exportColWidth = Math.max(28, columnWidth);
      const tableWidth = 340;
      const timelineStartX = tableWidth;
      const totalTimelineW = dates.length * exportColWidth;
      const exportWidth = tableWidth + totalTimelineW;

      const headerTopHeight = 65;
      const monthHeaderHeight = 26;
      const dayHeaderHeight = 28;
      const timelineHeaderHeight = monthHeaderHeight + dayHeaderHeight;
      const rowHeight = 38;
      const gridStartY = headerTopHeight + timelineHeaderHeight + 12;
      const gridHeight = tasks.length * rowHeight;
      const exportHeight = gridStartY + gridHeight + 35;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = exportWidth;
      canvas.height = exportHeight;

      // 1. Fundo Branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // 2. Cabeçalho Superior (Título e Metadados)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(
        `Cacique Agil — Gráfico de Gantt: ${ganttData?.projectName || 'Projeto'}`,
        16,
        28,
      );

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      const metaText = `Exportado em ${new Date().toLocaleDateString('pt-BR')} • ${tasks.length} tarefas • ${dependencies.length} dependências`;
      ctx.fillText(metaText, 16, 48);

      // Legenda de Cores no Topo à Direita
      const legendX = Math.max(450, exportWidth - 460);
      const legendY = 32;

      // Azul: Tarefa
      ctx.fillStyle = '#2563eb';
      drawRoundRect(ctx, legendX, legendY - 10, 14, 14, 3);
      ctx.fillStyle = '#334155';
      ctx.font = '11px sans-serif';
      ctx.fillText('Tarefa', legendX + 18, legendY + 1);

      // Vermelho: Caminho Crítico
      ctx.fillStyle = '#ef4444';
      drawRoundRect(ctx, legendX + 70, legendY - 10, 14, 14, 3);
      ctx.fillStyle = '#334155';
      ctx.fillText('Caminho Crítico', legendX + 88, legendY + 1);

      // Roxo: Marco
      const diamondLegX = legendX + 195;
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.moveTo(diamondLegX + 7, legendY - 11);
      ctx.lineTo(diamondLegX + 14, legendY - 4);
      ctx.lineTo(diamondLegX + 7, legendY + 3);
      ctx.lineTo(diamondLegX, legendY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillText('Marco', diamondLegX + 18, legendY + 1);

      // Linha Vermelha: Hoje
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(legendX + 250, legendY - 10, 3, 14);
      ctx.fillStyle = '#334155';
      ctx.fillText('Hoje', legendX + 258, legendY + 1);

      // Linha divisória horizontal abaixo do cabeçalho superior
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, headerTopHeight);
      ctx.lineTo(exportWidth, headerTopHeight);
      ctx.stroke();

      // 3. Cabeçalho da Tabela à Esquerda (ID, Tarefa, Duração)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, headerTopHeight, tableWidth, timelineHeaderHeight);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ID', 16, headerTopHeight + 32);
      ctx.fillText('Tarefa', 80, headerTopHeight + 32);
      ctx.fillText('Duração', 270, headerTopHeight + 32);

      // 4. Régua de Tempo Superior: Meses
      const monthGroups: Array<{ label: string; span: number; startIndex: number }> = [];
      let currentMonth = '';
      let currentSpan = 0;
      let currentStart = 0;

      dates.forEach((d, index) => {
        const monthLabel = d.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        });
        if (monthLabel !== currentMonth) {
          if (currentSpan > 0) {
            monthGroups.push({ label: currentMonth, span: currentSpan, startIndex: currentStart });
          }
          currentMonth = monthLabel;
          currentSpan = 1;
          currentStart = index;
        } else {
          currentSpan++;
        }
      });
      if (currentSpan > 0) {
        monthGroups.push({ label: currentMonth, span: currentSpan, startIndex: currentStart });
      }

      // Desenhar Barra de Meses
      monthGroups.forEach((mg) => {
        const mgX = timelineStartX + mg.startIndex * exportColWidth;
        const mgW = mg.span * exportColWidth;

        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(mgX, headerTopHeight, mgW, monthHeaderHeight);

        // Borda direita do mês
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mgX + mgW, headerTopHeight);
        ctx.lineTo(mgX + mgW, headerTopHeight + monthHeaderHeight);
        ctx.stroke();

        // Rótulo do Mês (capitalizado)
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px sans-serif';
        const capitalizedMonth = mg.label.charAt(0).toUpperCase() + mg.label.slice(1);
        ctx.fillText(capitalizedMonth, mgX + 10, headerTopHeight + 17);
      });

      // Linha horizontal separadora entre Mês e Dias
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(timelineStartX, headerTopHeight + monthHeaderHeight);
      ctx.lineTo(exportWidth, headerTopHeight + monthHeaderHeight);
      ctx.stroke();

      // 5. Régua de Tempo Inferior: Dias e Dias da Semana
      const dayOfWeekNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      const todayIso = toIsoDate(new Date());

      dates.forEach((d, index) => {
        const colX = timelineStartX + index * exportColWidth;
        const weekend = isWeekend(d);
        const dayNum = d.getDate();
        const dayName = dayOfWeekNames[d.getDay()];

        // Fundo do cabeçalho do dia
        ctx.fillStyle = weekend ? '#f1f5f9' : '#f8fafc';
        ctx.fillRect(colX, headerTopHeight + monthHeaderHeight, exportColWidth, dayHeaderHeight);

        // Borda direita da coluna de dia
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colX + exportColWidth, headerTopHeight + monthHeaderHeight);
        ctx.lineTo(colX + exportColWidth, headerTopHeight + timelineHeaderHeight);
        ctx.stroke();

        // Número do Dia
        ctx.fillStyle = weekend ? '#64748b' : '#0f172a';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(dayNum), colX + exportColWidth / 2, headerTopHeight + monthHeaderHeight + 14);

        // Nome do Dia da Semana
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px sans-serif';
        ctx.fillText(dayName || '', colX + exportColWidth / 2, headerTopHeight + monthHeaderHeight + 24);
      });
      ctx.textAlign = 'start'; // reset text align

      // Linha horizontal abaixo de todo o cabeçalho temporal
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, headerTopHeight + timelineHeaderHeight);
      ctx.lineTo(exportWidth, headerTopHeight + timelineHeaderHeight);
      ctx.stroke();

      // 6. Grade da Linha do Tempo (Linhas Verticais e Finais de Semana)
      dates.forEach((d, index) => {
        const colX = timelineStartX + index * exportColWidth;
        const weekend = isWeekend(d);

        // Fundo de fim de semana
        if (weekend) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
          ctx.fillRect(colX, gridStartY, exportColWidth, gridHeight);
        }

        // Linha vertical de cada dia
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colX, gridStartY);
        ctx.lineTo(colX, gridStartY + gridHeight);
        ctx.stroke();
      });

      // 7. Linhas Horizontais de Tarefas e Dados da Tabela Lateral
      tasks.forEach((task, index) => {
        const rowY = gridStartY + index * rowHeight;

        // Fundo alternado sutil
        if (index % 2 === 1) {
          ctx.fillStyle = '#fafafa';
          ctx.fillRect(0, rowY, exportWidth, rowHeight);
        }

        // Linha divisória horizontal da linha
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, rowY + rowHeight);
        ctx.lineTo(exportWidth, rowY + rowHeight);
        ctx.stroke();

        // Dados na Tabela Lateral
        ctx.fillStyle = task.isCritical ? '#ef4444' : '#2563eb';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(task.key, 16, rowY + 23);

        ctx.fillStyle = '#0f172a';
        ctx.font = task.isCritical ? 'bold 11px sans-serif' : '11px sans-serif';
        const displayTitle = task.title.length > 26 ? task.title.slice(0, 25) + '…' : task.title;
        ctx.fillText(displayTitle, 80, rowY + 23);

        let durationStr = '1d';
        if (task.isMilestone) {
          durationStr = 'Marco';
        } else if (task.startDate && task.dueDate) {
          const s = parseDate(task.startDate);
          const e = parseDate(task.dueDate);
          if (s && e) {
            durationStr = `${Math.max(1, diffDays(s, e) + 1)}d`;
          }
        }
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText(durationStr, 270, rowY + 23);
      });

      // 8. Linha Divisória Vertical Entre Tabela e Linha do Tempo
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(timelineStartX, headerTopHeight);
      ctx.lineTo(timelineStartX, gridStartY + gridHeight);
      ctx.stroke();

      // 9. Linha de Hoje (Today Line)
      dates.forEach((d, index) => {
        if (toIsoDate(d) === todayIso) {
          const colX = timelineStartX + index * exportColWidth + exportColWidth / 2;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(colX, gridStartY);
          ctx.lineTo(colX, gridStartY + gridHeight);
          ctx.stroke();

          // Badge Hoje
          ctx.fillStyle = '#ef4444';
          drawRoundRect(ctx, colX - 16, gridStartY + 2, 32, 14, 3);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('HOJE', colX, gridStartY + 12);
          ctx.textAlign = 'start';
        }
      });

      // 10. Mapa de Coordenadas Exportadas e Desenho das Barras do Gantt
      const taskCoordsMap = new Map<string, { xStart: number; xEnd: number; yCenter: number }>();

      tasks.forEach((task, index) => {
        const rowY = gridStartY + index * rowHeight;
        const s = parseDate(task.startDate) || parseDate(task.dueDate) || minDate;
        const e = parseDate(task.dueDate) || s;
        const startOffset = Math.max(0, diffDays(minDate, s));
        const duration = task.isMilestone ? 0 : Math.max(1, diffDays(s, e) + 1);

        const xStart = timelineStartX + startOffset * exportColWidth;
        const barW = task.isMilestone ? 20 : Math.max(exportColWidth, duration * exportColWidth);
        const xEnd = task.isMilestone ? xStart + 20 : xStart + barW;
        const yCenter = rowY + rowHeight / 2;

        taskCoordsMap.set(task.id, { xStart, xEnd, yCenter });

        const isCritical = highlightCritical && task.isCritical;

        // Desenhar Marco (Milestone) em Losango
        if (task.isMilestone) {
          const diamondX = xStart + 10;
          const diamondY = yCenter;

          ctx.fillStyle = isCritical ? '#ef4444' : '#8b5cf6';
          ctx.beginPath();
          ctx.moveTo(diamondX, diamondY - 8);
          ctx.lineTo(diamondX + 8, diamondY);
          ctx.lineTo(diamondX, diamondY + 8);
          ctx.lineTo(diamondX - 8, diamondY);
          ctx.closePath();
          ctx.fill();

          // Rótulo ao lado do marco
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`${task.key} ${task.title} (Marco)`, diamondX + 14, diamondY + 4);
        } else {
          // Barra Normal de Tarefa
          const barY = rowY + 7;
          const barH = rowHeight - 14;

          // Sombra sutil
          ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
          drawRoundRect(ctx, xStart + 1, barY + 1, barW, barH, 4);

          // Fundo da barra
          ctx.fillStyle = isCritical ? '#ef4444' : (task.statusColor || '#2563eb');
          drawRoundRect(ctx, xStart, barY, barW, barH, 4);

          // Barra interna de progresso
          if (task.progress > 0) {
            const progW = (barW * Math.min(100, task.progress)) / 100;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            drawRoundRect(ctx, xStart, barY, progW, barH, 4);
          }

          // Rótulo da tarefa
          if (barW >= 120) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(`${task.key} ${task.title}`, xStart + 8, barY + barH - 6);
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(`${task.key} ${task.title}`, xStart + barW + 8, barY + barH - 6);
          }
        }
      });

      // 11. Setas de Dependência no Canvas
      const criticalTaskSet = new Set(tasks.filter((t) => t.isCritical).map((t) => t.id));

      dependencies.forEach((dep) => {
        const pred = taskCoordsMap.get(dep.predecessorId);
        const succ = taskCoordsMap.get(dep.successorId);
        if (!pred || !succ) return;

        const isCriticalDep =
          highlightCritical &&
          criticalTaskSet.has(dep.predecessorId) &&
          criticalTaskSet.has(dep.successorId);
        ctx.strokeStyle = isCriticalDep ? '#ef4444' : '#94a3b8';
        ctx.fillStyle = isCriticalDep ? '#ef4444' : '#94a3b8';
        ctx.lineWidth = isCriticalDep ? 2 : 1.5;

        const startX = pred.xEnd;
        const startY = pred.yCenter;
        const endX = succ.xStart;
        const endY = succ.yCenter;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        if (endX >= startX + 15) {
          const midX = startX + 12;
          ctx.lineTo(midX, startY);
          ctx.lineTo(midX, endY);
          ctx.lineTo(endX, endY);
        } else {
          const stepX = startX + 10;
          const detourY = startY + (endY > startY ? 14 : -14);
          ctx.lineTo(stepX, startY);
          ctx.lineTo(stepX, detourY);
          ctx.lineTo(endX - 12, detourY);
          ctx.lineTo(endX - 12, endY);
          ctx.lineTo(endX, endY);
        }
        ctx.stroke();

        // Cabeça da seta
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - 6, endY - 4);
        ctx.lineTo(endX - 6, endY + 4);
        ctx.closePath();
        ctx.fill();
      });

      // 12. Rodapé com Informações
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText(
        'Gerado por Cacique Agil — Plataforma de Gerenciamento e Fluxo de Projetos',
        16,
        exportHeight - 12,
      );

      // Baixar imagem gerada
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `cacique-agil-gantt-${ganttData?.projectId || 'export'}.png`;
      a.click();
      setFeedbackMessage('Gráfico de Gantt exportado em PNG com sucesso!');
    } catch {
      setFeedbackMessage('Falha ao exportar imagem.');
    } finally {
      setIsExporting(false);
    }
  };

  // Arrastar barra para alterar datas
  const _handleDragTask = async (task: GanttTaskItemDto, deltaDays: number) => {
    if (!canWrite || deltaDays === 0) return;
    const currentStart = parseDate(task.startDate) || startOfDay(new Date());
    const currentDue = parseDate(task.dueDate) || currentStart;

    const newStart = addDays(currentStart, deltaDays);
    const newDue = addDays(currentDue, deltaDays);

    await tasksApi.update(task.id, {
      startDate: toIsoDate(newStart),
      dueDate: toIsoDate(newDue),
    });

    await queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    await queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (error || !ganttData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Não foi possível carregar os dados do gráfico de Gantt.</Alert>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      className={styles.ganttContainer}
      data-testid="gantt-container"
      sx={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1190,
              bgcolor: 'background.paper',
              borderRadius: 0,
              m: 0,
              p: 0,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }
          : {
              mt: 1.5,
              height: 'calc(100vh - 220px)',
              minHeight: 480,
            }
      }
    >
      {/* Barra de Ferramentas Superior */}
      <GanttToolbar
        zoom={zoom}
        onChangeZoom={setZoom}
        highlightCritical={highlightCritical}
        onToggleCritical={setHighlightCritical}
        baselines={baselines}
        selectedBaselineId={selectedBaselineId}
        onSelectBaseline={setSelectedBaselineId}
        onOpenSaveBaseline={() => setBaselineDialogOpen(true)}
        onOpenAddDependency={() => setDependencyDialogOpen(true)}
        onAutoReschedule={handleAutoReschedule}
        onExportPng={handleExportPng}
        isExporting={isExporting}
        canWrite={canWrite}
        tableCollapsed={tableCollapsed}
        onToggleTable={() => setTableCollapsed((prev) => !prev)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Visão Dividida: Tabela à Esquerda + Linha do Tempo à Direita */}
      <Box className={styles.splitView} sx={{ position: 'relative' }}>
        {/* Tabela Lateral Esquerda com suporte a colapso e flexibilidade */}
        <Box
          sx={{
            width: tableCollapsed ? 0 : 360,
            minWidth: tableCollapsed ? 0 : 320,
            maxWidth: 420,
            flexShrink: 0,
            transition: 'width 0.2s ease, min-width 0.2s ease',
            overflow: 'hidden',
            borderRight: tableCollapsed ? 0 : 1,
            borderColor: 'divider',
            display: tableCollapsed ? 'none' : 'flex',
            flexDirection: 'column',
          }}
          data-testid="gantt-table-container"
        >
          <GanttTaskTable
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(id) => {
              setSelectedTaskId(id);
              onOpenTaskDetail(id);
            }}
            scrollRef={tableScrollRef}
            onCollapseTable={() => setTableCollapsed(true)}
          />
        </Box>

        {/* Botão flutuante para reabrir a tabela quando estiver colapsada */}
        {tableCollapsed && (
          <Box
            sx={{
              position: 'absolute',
              top: 66,
              left: 8,
              zIndex: 20,
            }}
          >
            <Tooltip title={_t('showTable')}>
              <IconButton
                size="small"
                onClick={() => setTableCollapsed(false)}
                data-testid="expand-table-floating-button"
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  border: 1,
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                aria-label={_t('showTable')}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Linha do Tempo Interativa (Scrollável X e Y) */}
        <Box
          className={styles.timelineArea}
          ref={timelineScrollRef}
          onScroll={handleTimelineScroll}
          data-testid="gantt-timeline-area"
        >
          {/* Régua de Tempo */}
          <GanttTimelineHeader dates={dates} zoom={zoom} columnWidth={columnWidth} />

          {/* Área do Gráfico */}
          <Box
            sx={{
              position: 'relative',
              width: totalTimelineWidth,
              height: Math.max(300, totalTimelineHeight),
              minHeight: '100%',
            }}
          >
            {/* Grade de Dias e Marcador Hoje */}
            <GanttGrid
              dates={dates}
              zoom={zoom}
              columnWidth={columnWidth}
              totalHeight={Math.max(300, totalTimelineHeight)}
            />

            {/* Camada Vetorial SVG de Dependências */}
            <GanttDependencyArrows
              dependencies={dependencies}
              tasks={tasks}
              getTaskCoordinates={getTaskCoordinates}
              totalWidth={totalTimelineWidth}
              totalHeight={totalTimelineHeight}
              highlightCritical={highlightCritical}
              onSelectDependency={(dep) => {
                if (canWrite && window.confirm('Deseja remover esta dependência?')) {
                  handleDeleteDependency(dep);
                }
              }}
            />

            {/* Linhas de Tarefas e Barras */}
            {tasks.map((task, index) => {
              const coord = getTaskCoordinates(task.id);
              if (!coord) return null;

              const isCritical = highlightCritical && task.isCritical;
              const hasBaseline = Boolean(task.baselineStartDate || task.baselineDueDate);

              // Coordenadas da barra de baseline
              let baselineLeft = 0;
              let baselineWidth = 0;
              if (hasBaseline) {
                const bS =
                  parseDate(task.baselineStartDate) ||
                  parseDate(task.baselineDueDate) ||
                  minDate;
                const bE = parseDate(task.baselineDueDate) || bS;
                const bStartOffset = Math.max(0, diffDays(minDate, bS));
                const bDuration = Math.max(1, diffDays(bS, bE) + 1);
                baselineLeft = bStartOffset * columnWidth;
                baselineWidth = Math.max(columnWidth, bDuration * columnWidth);
              }

              return (
                <Box
                  key={task.id}
                  className={styles.taskRowTimeline}
                  sx={{ top: CHART_TOP_OFFSET + index * ROW_HEIGHT, position: 'absolute', width: '100%' }}
                >
                  {/* Marco (Milestone) em Losango */}
                  {task.isMilestone ? (
                    <>
                      <Tooltip
                        title={`${task.key}: ${task.title} (Marco — ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem data'})`}
                      >
                        <Box
                          className={`${styles.milestoneDiamond} ${isCritical ? styles.milestoneCritical : ''}`}
                          style={{ left: coord.xStart }}
                          onClick={() => onOpenTaskDetail(task.id)}
                          data-testid={`gantt-milestone-${task.key}`}
                        />
                      </Tooltip>
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          left: coord.xStart + 28,
                          top: 12,
                          fontWeight: 600,
                          color: 'text.primary',
                          whiteSpace: 'nowrap',
                          zIndex: 6,
                          cursor: 'pointer',
                        }}
                        onClick={() => onOpenTaskDetail(task.id)}
                      >
                        {task.key} {task.title}
                      </Typography>
                    </>
                  ) : (
                    /* Barra Normal de Tarefa */
                    <>
                      <Tooltip
                        title={
                          <Box sx={{ p: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {task.key}: {task.title}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Período:{' '}
                              {task.startDate ? new Date(task.startDate).toLocaleDateString('pt-BR') : '?'}
                              {' até '}
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '?'}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Progresso: {task.progress}%
                            </Typography>
                            {isCritical && (
                              <Typography variant="caption" display="block" color="error.light">
                                ★ No Caminho Crítico (Folga: 0d)
                              </Typography>
                            )}
                            {task.varianceDays !== null && task.varianceDays !== undefined && (
                              <Typography
                                variant="caption"
                                display="block"
                                color={task.varianceDays > 0 ? 'error.light' : 'success.light'}
                              >
                                {task.varianceDays > 0
                                  ? `+${task.varianceDays} dias de atraso vs Linha de Base`
                                  : `${task.varianceDays} dias vs Linha de Base`}
                              </Typography>
                            )}
                          </Box>
                        }
                      >
                        <Box
                          className={`${styles.taskBar} ${isCritical ? styles.taskBarCritical : ''}`}
                          sx={{
                            left: coord.xStart,
                            width: coord.width,
                            bgcolor: isCritical ? '#ef4444' : (task.statusColor || 'primary.main'),
                            color: '#ffffff',
                          }}
                          onClick={() => onOpenTaskDetail(task.id)}
                          data-testid={`gantt-bar-${task.key}`}
                        >
                          {/* Barra Interna de Progresso */}
                          <Box
                            className={styles.progressBar}
                            style={{ width: `${task.progress}%` }}
                          />
                          {coord.width >= 120 && (
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{
                                position: 'relative',
                                zIndex: 2,
                                fontWeight: 600,
                                color: '#ffffff',
                                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                              }}
                            >
                              {task.key} {task.title}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                      {coord.width < 120 && (
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            left: coord.xStart + coord.width + 8,
                            top: 12,
                            fontWeight: 600,
                            color: 'text.primary',
                            whiteSpace: 'nowrap',
                            zIndex: 6,
                            cursor: 'pointer',
                          }}
                          onClick={() => onOpenTaskDetail(task.id)}
                        >
                          {task.key} {task.title}
                        </Typography>
                      )}
                    </>
                  )}

                  {/* Barra Comparativa de Linha de Base (Baseline) */}
                  {selectedBaselineId && hasBaseline && (
                    <Tooltip
                      title={`Linha de Base Planejada: ${task.baselineStartDate ? new Date(task.baselineStartDate).toLocaleDateString('pt-BR') : ''} até ${task.baselineDueDate ? new Date(task.baselineDueDate).toLocaleDateString('pt-BR') : ''}`}
                    >
                      <Box
                        className={styles.baselineBar}
                        style={{
                          left: baselineLeft,
                          width: baselineWidth,
                        }}
                        data-testid={`gantt-baseline-${task.key}`}
                      />
                    </Tooltip>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Modal para Adicionar Dependência */}
      <GanttDependencyDialog
        open={dependencyDialogOpen}
        onClose={() => setDependencyDialogOpen(false)}
        tasks={tasks}
        onSubmit={handleAddDependency}
      />

      {/* Modal para Salvar e Gerenciar Linhas de Base */}
      <GanttBaselineDialog
        open={baselineDialogOpen}
        onClose={() => setBaselineDialogOpen(false)}
        baselines={baselines}
        onCreateBaseline={handleCreateBaseline}
        onDeleteBaseline={handleDeleteBaseline}
      />

      {/* Feedback Snackbar */}
      <Snackbar
        open={Boolean(feedbackMessage)}
        autoHideDuration={4000}
        onClose={() => setFeedbackMessage(null)}
      >
        <Alert onClose={() => setFeedbackMessage(null)} severity="info" variant="filled">
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
