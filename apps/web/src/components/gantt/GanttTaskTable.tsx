'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DiamondIcon from '@mui/icons-material/Diamond';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useTranslations } from 'next-intl';
import { diffDays, GanttTaskItemDto, parseDate } from '@fluxo/shared';

interface GanttTaskTableProps {
  tasks: GanttTaskItemDto[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onCollapseTable?: () => void;
}

export function GanttTaskTable({
  tasks,
  selectedTaskId,
  onSelectTask,
  scrollRef,
  onCollapseTable,
}: GanttTaskTableProps) {
  const t = useTranslations('gantt');

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Cabeçalho da Tabela com Botão de Ocultar/Recolher */}
      <Box
        sx={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          px: 1,
          bgcolor: 'background.default',
          borderBottom: 2,
          borderColor: 'divider',
          fontWeight: 600,
          fontSize: '0.8125rem',
          color: 'text.secondary',
          userSelect: 'none',
        }}
      >
        <Box sx={{ width: 75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {onCollapseTable && (
            <Tooltip title={t('hideTable')}>
              <IconButton
                size="small"
                onClick={onCollapseTable}
                data-testid="collapse-table-button"
                sx={{ p: 0.5, mr: 0.5 }}
                aria-label={t('hideTable')}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <span>{t('idHeader')}</span>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, px: 0.5 }}>{t('taskHeader')}</Box>
        <Box sx={{ width: 60, textAlign: 'center' }}>{t('durationHeader')}</Box>
        <Box sx={{ width: 50, textAlign: 'center' }}>%</Box>
      </Box>

      {/* Linhas de Tarefa */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'hidden',
          overflowX: 'hidden',
          pt: '16px',
          pb: '24px',
        }}
      >
        {tasks.map((task) => {
          const isSelected = task.id === selectedTaskId;
          let durationDays = 1;
          if (task.isMilestone) {
            durationDays = 0;
          } else if (task.startDate && task.dueDate) {
            const s = parseDate(task.startDate);
            const e = parseDate(task.dueDate);
            if (s && e) {
              durationDays = Math.max(1, diffDays(s, e) + 1);
            }
          }

          return (
            <Box
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              sx={{
                height: 44,
                display: 'flex',
                alignItems: 'center',
                px: 1,
                borderBottom: 1,
                borderColor: 'divider',
                cursor: 'pointer',
                bgcolor: isSelected ? 'action.selected' : 'inherit',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background-color 0.15s ease',
              }}
              data-testid={`gantt-table-row-${task.key}`}
            >
              {/* Chave da Tarefa */}
              <Box sx={{ width: 75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {task.isMilestone && (
                  <DiamondIcon sx={{ fontSize: 13, color: '#8b5cf6' }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: task.isCritical ? 'error.main' : 'primary.main',
                  }}
                >
                  {task.key}
                </Typography>
              </Box>

              {/* Título */}
              <Box sx={{ flex: 1, minWidth: 0, px: 0.5 }}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: task.isCritical ? 600 : 400,
                    fontSize: '0.8125rem',
                    color: 'text.primary',
                  }}
                >
                  {task.title}
                </Typography>
              </Box>

              {/* Duração em dias */}
              <Box sx={{ width: 60, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {task.isMilestone ? 'Marco' : `${durationDays}d`}
                </Typography>
              </Box>

              {/* Progresso % */}
              <Box sx={{ width: 50, textAlign: 'center' }}>
                <Chip
                  size="small"
                  label={`${task.progress}%`}
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    px: 0,
                    borderColor:
                      task.progress === 100
                        ? 'success.light'
                        : task.progress > 0
                          ? 'primary.light'
                          : 'divider',
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
