'use client';

import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import AddIcon from '@mui/icons-material/Add';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  CreateWorkflowStatusRequest,
  StatusCategory,
  TaskDto,
  TaskPriority,
  UpdateWorkflowStatusRequest,
  WorkflowStatusDto,
  WorkspaceMemberDto,
} from '@fluxo/shared';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard, getPriorityColor, getPriorityLabel } from './KanbanCard';
import { ColumnSettingsDialog } from './ColumnSettingsDialog';

export type KanbanSwimlaneType = 'none' | 'priority' | 'assignee';

export interface TaskKanbanViewProps {
  tasks: TaskDto[];
  statuses: WorkflowStatusDto[];
  members: WorkspaceMemberDto[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onMoveTask: (
    taskId: string,
    patch: { statusId: string; position: number },
  ) => Promise<void>;
  onQuickCreateTask: (title: string, statusId?: string) => Promise<void>;
  onCreateStatus: (input: CreateWorkflowStatusRequest) => Promise<void>;
  onUpdateStatus: (
    statusId: string,
    input: UpdateWorkflowStatusRequest,
  ) => Promise<void>;
  onDeleteStatus: (statusId: string) => Promise<void>;
  canWrite: boolean;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  tasks,
  statuses,
  members,
  onSelectTask,
  onMoveTask,
  onQuickCreateTask,
  onCreateStatus,
  onUpdateStatus,
  onDeleteStatus,
  canWrite,
}) => {
  const [swimlane, setSwimlane] = useState<KanbanSwimlaneType>('none');
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Record<string, boolean>>({});
  const [activeTask, setActiveTask] = useState<TaskDto | null>(null);

  // Modal de Coluna
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<WorkflowStatusDto | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Ordena status por posição
  const sortedStatuses = useMemo(() => {
    return [...statuses].sort((a, b) => a.position - b.position);
  }, [statuses]);

  // Mapa de tarefas por coluna
  const tasksByStatus = useMemo(() => {
    const map = new Map<string, TaskDto[]>();
    for (const status of sortedStatuses) {
      map.set(status.id, []);
    }
    for (const task of tasks) {
      const list = map.get(task.statusId);
      if (list) {
        list.push(task);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [sortedStatuses, tasks]);

  // Swimlanes
  const swimlaneGroups = useMemo(() => {
    if (swimlane === 'priority') {
      const priorities = [
        TaskPriority.URGENT,
        TaskPriority.HIGH,
        TaskPriority.MEDIUM,
        TaskPriority.LOW,
        TaskPriority.NONE,
      ];
      return priorities.map((prio) => ({
        id: prio,
        title: getPriorityLabel(prio),
        color: getPriorityColor(prio),
        tasks: tasks.filter((t) => t.priority === prio),
      }));
    }

    if (swimlane === 'assignee') {
      const memberGroups = members.map((m) => ({
        id: m.user.id,
        title: m.user.name,
        color: '#2563EB',
        tasks: tasks.filter((t) => t.assigneeIds.includes(m.user.id)),
      }));

      memberGroups.push({
        id: 'unassigned',
        title: 'Não atribuído',
        color: '#94A3B8',
        tasks: tasks.filter((t) => t.assigneeIds.length === 0),
      });

      return memberGroups;
    }

    return [];
  }, [swimlane, tasks, members]);

  const toggleSwimlane = (id: string) => {
    setCollapsedSwimlanes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !canWrite) return;

    const activeTaskId = String(active.id);
    const task = tasks.find((t) => t.id === activeTaskId);
    if (!task) return;

    // Descobre status de destino
    let targetStatusId = task.statusId;
    let targetPosition = task.position;

    const overId = String(over.id);
    const isOverColumn = sortedStatuses.some((s) => s.id === overId);

    if (isOverColumn) {
      targetStatusId = overId;
      const targetColumnTasks = tasksByStatus.get(targetStatusId) || [];
      const remainingTasks = targetColumnTasks.filter((t) => t.id !== activeTaskId);

      if (remainingTasks.length === 0) {
        targetPosition = 1000;
      } else {
        const lastTask = remainingTasks[remainingTasks.length - 1];
        targetPosition = lastTask ? lastTask.position + 1000 : 1000;
      }
    } else {
      // Over em outro Card
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;

      targetStatusId = overTask.statusId;
      const targetColumnTasks = (tasksByStatus.get(targetStatusId) || []).filter(
        (t) => t.id !== activeTaskId,
      );

      const overIndex = targetColumnTasks.findIndex((t) => t.id === overId);
      if (overIndex === -1) {
        targetPosition = overTask.position;
      } else {
        const prevTask = targetColumnTasks[overIndex - 1];
        const nextTask = targetColumnTasks[overIndex + 1];

        if (!prevTask) {
          // Solto antes do primeiro
          targetPosition = Math.max(overTask.position / 2, 10);
        } else if (!nextTask) {
          // Solto após o último
          targetPosition = overTask.position + 1000;
        } else {
          // Entre dois cards (ordenação fracionária)
          targetPosition = (prevTask.position + overTask.position) / 2;
        }
      }
    }

    if (targetStatusId !== task.statusId || Math.abs(targetPosition - task.position) > 0.001) {
      try {
        await onMoveTask(activeTaskId, {
          statusId: targetStatusId,
          position: targetPosition,
        });
      } catch (err) {
        console.error('Falha ao mover tarefa no Kanban:', err);
      }
    }
  };

  const handleOpenCreateColumn = () => {
    setEditingStatus(null);
    setDialogOpen(true);
  };

  const handleOpenEditColumn = (status: WorkflowStatusDto) => {
    setEditingStatus(status);
    setDialogOpen(true);
  };

  const handleSaveColumn = async (data: {
    name: string;
    category: StatusCategory;
    color: string;
    wipLimit: number | null;
  }) => {
    if (editingStatus) {
      await onUpdateStatus(editingStatus.id, data);
    } else {
      await onCreateStatus(data);
    }
  };

  return (
    <Box sx={{ width: '100%', pb: 3 }} data-testid="kanban-board-container">
      {/* Barra de Ações do Kanban */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Seletor de Raias (Swimlanes) */}
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="kanban-swimlane-label">Agrupamento (Raias)</InputLabel>
            <Select
              labelId="kanban-swimlane-label"
              value={swimlane}
              label="Agrupamento (Raias)"
              onChange={(e) => setSwimlane(e.target.value as KanbanSwimlaneType)}
              data-testid="swimlane-select"
            >
              <MenuItem value="none">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewWeekIcon fontSize="small" />
                  <span>Sem raias (Padrão)</span>
                </Box>
              </MenuItem>
              <MenuItem value="priority">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewStreamIcon fontSize="small" />
                  <span>Por Prioridade</span>
                </Box>
              </MenuItem>
              <MenuItem value="assignee">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewStreamIcon fontSize="small" />
                  <span>Por Responsável</span>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', md: 'inline' } }}>
            {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'} em {sortedStatuses.length} colunas
          </Typography>
        </Box>

        {canWrite && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={handleOpenCreateColumn}
            data-testid="add-column-button"
          >
            Nova Coluna
          </Button>
        )}
      </Box>

      {/* Tabuleiro Kanban com DndContext */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {swimlane === 'none' ? (
          /* Visualização Normal por Colunas */
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 2,
              alignItems: 'flex-start',
              minHeight: 480,
            }}
          >
            {sortedStatuses.map((status) => (
              <KanbanColumn
                key={status.id}
                status={status}
                tasks={tasksByStatus.get(status.id) || []}
                members={members}
                onSelectTask={onSelectTask}
                onQuickCreateTask={onQuickCreateTask}
                onEditColumn={handleOpenEditColumn}
                canWrite={canWrite}
              />
            ))}
          </Box>
        ) : (
          /* Visualização por Raias (Swimlanes) */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {swimlaneGroups.map((group) => {
              const isCollapsed = Boolean(collapsedSwimlanes[group.id]);
              return (
                <Box
                  key={group.id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 1.5,
                  }}
                  data-testid={`swimlane-${group.id}`}
                >
                  {/* Cabeçalho da Raia */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => toggleSwimlane(group.id)}
                  >
                    <IconButton size="small">
                      {isCollapsed ? <KeyboardArrowRightIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>

                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: group.color,
                      }}
                    />

                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {group.title}
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      ({group.tasks.length})
                    </Typography>
                  </Box>

                  {/* Colunas dentro da Raia */}
                  <Collapse in={!isCollapsed}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        pt: 2,
                        alignItems: 'flex-start',
                      }}
                    >
                      {sortedStatuses.map((status) => {
                        const laneTasks = group.tasks.filter((t) => t.statusId === status.id);
                        return (
                          <KanbanColumn
                            key={`${group.id}-${status.id}`}
                            status={status}
                            tasks={laneTasks}
                            members={members}
                            onSelectTask={onSelectTask}
                            onQuickCreateTask={onQuickCreateTask}
                            onEditColumn={handleOpenEditColumn}
                            canWrite={canWrite}
                          />
                        );
                      })}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        )}

        {/* DragOverlay com sombra suave */}
        <DragOverlay>
          {activeTask ? (
            <Box sx={{ width: 300, cursor: 'grabbing' }}>
              <KanbanCard
                task={activeTask}
                members={members}
                onClick={() => {}}
                isOverlay
              />
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal de Configuração de Coluna */}
      <ColumnSettingsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        status={editingStatus}
        onSave={handleSaveColumn}
        onDelete={editingStatus ? onDeleteStatus : undefined}
      />
    </Box>
  );
};
