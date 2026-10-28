'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskDto, WorkflowStatusDto, WorkspaceMemberDto } from '@fluxo/shared';
import { KanbanCard } from './KanbanCard';

export interface KanbanColumnProps {
  status: WorkflowStatusDto;
  tasks: TaskDto[];
  members: WorkspaceMemberDto[];
  onSelectTask: (taskId: string) => void;
  onQuickCreateTask: (title: string, statusId: string) => Promise<void>;
  onEditColumn: (status: WorkflowStatusDto) => void;
  canWrite: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  members,
  onSelectTask,
  onQuickCreateTask,
  onEditColumn,
  canWrite,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: 'Column',
      status,
    },
  });

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const wipLimit = status.wipLimit;
  const taskCount = tasks.length;
  const isWipExceeded = Boolean(wipLimit && taskCount > wipLimit);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || submitting) return;

    try {
      setSubmitting(true);
      await onQuickCreateTask(quickTitle.trim(), status.id);
      setQuickTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error('Erro ao criar tarefa rápida:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: 310,
        minWidth: 310,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isOver ? 'action.hover' : 'background.default',
        borderRadius: 2.5,
        p: 1.5,
        border: '1px solid',
        borderColor: isWipExceeded
          ? 'error.main'
          : isOver
            ? 'primary.main'
            : 'divider',
        borderTopWidth: isWipExceeded ? 3 : 1,
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        maxHeight: 'calc(100vh - 220px)',
      }}
      data-testid={`kanban-column-${status.id}`}
    >
      {/* Cabeçalho da Coluna */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: status.color || 'primary.main',
              flexShrink: 0,
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={status.name}
          >
            {status.name}
          </Typography>

          {/* Badge de Contagem / Limite WIP */}
          {wipLimit ? (
            <Tooltip
              title={
                isWipExceeded
                  ? `Limite WIP excedido: ${taskCount} de ${wipLimit} tarefas!`
                  : `Limite WIP: ${taskCount} de ${wipLimit} tarefas`
              }
              arrow
            >
              <Chip
                icon={isWipExceeded ? <WarningAmberIcon sx={{ fontSize: 13, color: '#fff !important' }} /> : undefined}
                label={`${taskCount}/${wipLimit}`}
                size="small"
                color={isWipExceeded ? 'error' : 'default'}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: isWipExceeded ? 'error.main' : 'action.selected',
                  color: isWipExceeded ? '#fff' : 'text.secondary',
                }}
                data-testid={`kanban-wip-badge-${status.id}`}
              />
            </Tooltip>
          ) : (
            <Chip
              label={taskCount}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: 'action.selected',
                color: 'text.secondary',
              }}
            />
          )}
        </Box>

        {canWrite && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Opções da coluna">
              <IconButton
                size="small"
                onClick={handleOpenMenu}
                data-testid={`column-menu-button-${status.id}`}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleCloseMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  onEditColumn(status);
                }}
                data-testid={`edit-column-action-${status.id}`}
              >
                <ListItemIcon>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Editar Coluna" />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  setIsAdding(true);
                }}
              >
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Adicionar Tarefa" />
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>

      {/* Alerta Visual de Limite WIP Excedido */}
      {isWipExceeded && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.5,
            mb: 1.25,
            borderRadius: 1,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}
          data-testid={`kanban-wip-alert-${status.id}`}
        >
          <WarningAmberIcon sx={{ fontSize: 15 }} />
          <span>Limite WIP excedido ({taskCount}/{wipLimit})</span>
        </Box>
      )}

      {/* Lista de Cards com SortableContext */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          pr: 0.5,
          minHeight: 120,
        }}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              members={members}
              onClick={onSelectTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              color: 'text.disabled',
            }}
          >
            <Typography variant="caption">Nenhuma tarefa aqui</Typography>
          </Box>
        )}
      </Box>

      {/* Adicionar Tarefa Rápida */}
      {canWrite && (
        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          {isAdding ? (
            <Box component="form" onSubmit={handleQuickSubmit}>
              <TextField
                autoFocus
                size="small"
                fullWidth
                placeholder="Título da tarefa..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsAdding(false);
                    setQuickTitle('');
                  }
                }}
                disabled={submitting}
                sx={{ mb: 1, bgcolor: 'background.paper' }}
                inputProps={{ 'data-testid': `quick-task-input-${status.id}` }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={() => {
                    setIsAdding(false);
                    setQuickTitle('');
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="small"
                  variant="contained"
                  disabled={!quickTitle.trim() || submitting}
                  data-testid={`quick-task-submit-${status.id}`}
                >
                  Adicionar
                </Button>
              </Box>
            </Box>
          ) : (
            <Button
              size="small"
              fullWidth
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => setIsAdding(true)}
              sx={{
                justifyContent: 'flex-start',
                color: 'text.secondary',
                py: 0.75,
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              data-testid={`quick-add-task-button-${status.id}`}
            >
              Adicionar tarefa
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};
