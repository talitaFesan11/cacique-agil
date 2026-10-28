'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tooltip from '@mui/material/Tooltip';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FlagIcon from '@mui/icons-material/Flag';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StatusCategory, TaskDto, TaskPriority, WorkspaceMemberDto } from '@fluxo/shared';

export interface KanbanCardProps {
  task: TaskDto;
  members: WorkspaceMemberDto[];
  onClick: (taskId: string) => void;
  isOverlay?: boolean;
}

export const getPriorityColor = (p: TaskPriority) => {
  switch (p) {
    case TaskPriority.URGENT:
      return '#EF4444';
    case TaskPriority.HIGH:
      return '#F97316';
    case TaskPriority.MEDIUM:
      return '#F59E0B';
    case TaskPriority.LOW:
      return '#3B82F6';
    default:
      return '#94A3B8';
  }
};

export const getPriorityLabel = (p: TaskPriority) => {
  switch (p) {
    case TaskPriority.URGENT:
      return 'Urgente';
    case TaskPriority.HIGH:
      return 'Alta';
    case TaskPriority.MEDIUM:
      return 'Média';
    case TaskPriority.LOW:
      return 'Baixa';
    default:
      return 'Nenhuma';
  }
};

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  members,
  onClick,
  isOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const memberMap = React.useMemo(() => {
    const map = new Map<string, WorkspaceMemberDto['user']>();
    for (const m of members) {
      map.set(m.user.id, m.user);
    }
    return map;
  }, [members]);

  // Checa se o prazo está vencido
  const isOverdue = React.useMemo(() => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    // Se a categoria do status for DONE, não considera vencida
    const isDone = task.status?.category === StatusCategory.DONE;
    return !isDone && due.getTime() < now.getTime();
  }, [task.dueDate, task.status?.category]);

  const formattedDueDate = React.useMemo(() => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }, [task.dueDate]);

  const checklistSummary = task.checklistSummary;
  const hasChecklists =
    checklistSummary && checklistSummary.totalItems > 0;
  const isChecklistComplete =
    hasChecklists && checklistSummary.completedItems === checklistSummary.totalItems;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      elevation={isOverlay ? 8 : 1}
      onClick={() => onClick(task.id)}
      sx={{
        p: 1.5,
        mb: 1.25,
        borderRadius: 2,
        cursor: isOverlay ? 'grabbing' : 'grab',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: isOverlay ? 'primary.main' : 'divider',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[3],
          borderColor: 'primary.light',
        },
        userSelect: 'none',
      }}
      data-testid={`kanban-card-${task.key}`}
    >
      {/* Topo do Card: Chave e Prioridade */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
          gap: 1,
        }}
      >
        <Chip
          label={task.key}
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'text.secondary',
            borderColor: 'divider',
          }}
        />

        {task.priority !== TaskPriority.NONE && (
          <Tooltip title={`Prioridade: ${getPriorityLabel(task.priority)}`} arrow>
            <Chip
              icon={<FlagIcon sx={{ fontSize: '0.75rem !important', color: `${getPriorityColor(task.priority)} !important` }} />}
              label={getPriorityLabel(task.priority)}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 600,
                bgcolor: `${getPriorityColor(task.priority)}15`,
                color: getPriorityColor(task.priority),
                border: '1px solid',
                borderColor: `${getPriorityColor(task.priority)}30`,
              }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Título da Tarefa */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          lineHeight: 1.35,
          mb: 1,
          wordBreak: 'break-word',
        }}
        data-testid={`kanban-card-title-${task.key}`}
      >
        {task.title}
      </Typography>

      {/* Etiquetas (Labels) */}
      {task.labels && task.labels.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.25 }}>
          {task.labels.map((label) => (
            <Chip
              key={label.id}
              label={label.name}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 500,
                bgcolor: `${label.color}20`,
                color: label.color,
                border: `1px solid ${label.color}40`,
              }}
            />
          ))}
        </Box>
      )}

      {/* Rodapé do Card: Prazo, Checklists, Comentários e Avatares */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pt: 0.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 1,
          fontSize: '0.75rem',
          color: 'text.secondary',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {/* Prazo */}
          {formattedDueDate && (
            <Tooltip title={isOverdue ? 'Prazo expirado!' : 'Data de entrega'} arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.4,
                  color: isOverdue ? 'error.main' : 'text.secondary',
                  fontWeight: isOverdue ? 700 : 500,
                }}
              >
                <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />
                <span>{formattedDueDate}</span>
              </Box>
            </Tooltip>
          )}

          {/* Checklist */}
          {hasChecklists && (
            <Tooltip
              title={`Checklist: ${checklistSummary?.completedItems} de ${checklistSummary?.totalItems} concluídos`}
              arrow
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.3,
                  color: isChecklistComplete ? 'success.main' : 'text.secondary',
                  fontWeight: 600,
                }}
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
                <span>
                  {checklistSummary?.completedItems}/{checklistSummary?.totalItems}
                </span>
              </Box>
            </Tooltip>
          )}

          {/* Comentários */}
          {(task.commentCount || 0) > 0 && (
            <Tooltip title={`${task.commentCount} comentário(s)`} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 13 }} />
                <span>{task.commentCount}</span>
              </Box>
            </Tooltip>
          )}

          {/* Anexos */}
          {(task.attachmentCount || 0) > 0 && (
            <Tooltip title={`${task.attachmentCount} anexo(s)`} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <AttachFileIcon sx={{ fontSize: 13 }} />
                <span>{task.attachmentCount}</span>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Avatares dos Responsáveis */}
        {task.assigneeIds && task.assigneeIds.length > 0 && (
          <AvatarGroup
            max={3}
            sx={{
              '& .MuiAvatar-root': {
                width: 22,
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 700,
              },
            }}
          >
            {task.assigneeIds.map((id) => {
              const u = memberMap.get(id);
              return (
                <Tooltip key={id} title={u ? u.name : 'Responsável'} arrow>
                  <Avatar
                    alt={u?.name || 'User'}
                    src={u?.avatarUrl || undefined}
                    sx={{ bgcolor: u ? stringToColor(u.name) : 'primary.main' }}
                  >
                    {u?.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </Tooltip>
              );
            })}
          </AvatarGroup>
        )}
      </Box>
    </Paper>
  );
};

function stringToColor(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#2563EB',
    '#7C3AED',
    '#DB2777',
    '#059669',
    '#D97706',
    '#DC2626',
    '#0891B2',
  ];
  return colors[Math.abs(hash) % colors.length];
}
