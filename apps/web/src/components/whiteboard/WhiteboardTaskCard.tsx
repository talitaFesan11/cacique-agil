'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { CanvasElement, TaskPriority } from '@fluxo/shared';
import styles from './whiteboard.module.css';

interface WhiteboardTaskCardProps {
  element: CanvasElement;
  isSelected: boolean;
  onOpenTask: (taskId: string) => void;
  onUpdateStatus?: (taskId: string, statusId: string) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  URGENT: { bg: '#fee2e2', text: '#dc2626', label: 'Urgente' },
  HIGH: { bg: '#ffedd5', text: '#ea580c', label: 'Alta' },
  MEDIUM: { bg: '#fef3c7', text: '#d97706', label: 'Média' },
  LOW: { bg: '#dbeafe', text: '#2563eb', label: 'Baixa' },
  NONE: { bg: '#f1f5f9', text: '#64748b', label: 'Sem prioridade' },
};

export const WhiteboardTaskCard: React.FC<WhiteboardTaskCardProps> = ({
  element,
  isSelected,
  onOpenTask,
}) => {
  const priority = (element.taskPriority as TaskPriority) || 'NONE';
  const priorityConfig = PRIORITY_COLORS[priority] || PRIORITY_COLORS.NONE;

  return (
    <div
      className={`${styles.taskCard} ${isSelected ? styles.elementSelected : ''}`}
      style={{
        width: element.width,
        height: element.height,
      }}
      data-testid={`task-card-${element.taskId || element.id}`}
      onDoubleClick={() => element.taskId && onOpenTask(element.taskId)}
    >
      <div className={styles.taskHeader}>
        <span className={styles.taskKey}>{element.taskKey || 'TAREFA'}</span>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip
            label={priorityConfig.label}
            size="small"
            sx={{
              height: 18,
              fontSize: '10px',
              fontWeight: 700,
              bgcolor: priorityConfig.bg,
              color: priorityConfig.text,
            }}
          />
          {element.taskId && (
            <Tooltip title="Abrir Detalhes da Tarefa">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTask(element.taskId!);
                }}
                sx={{ width: 22, height: 22, color: '#6366f1' }}
              >
                <OpenInNewIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </div>

      <div className={styles.taskTitle}>
        {element.taskTitle || element.text || 'Sem título'}
      </div>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Chip
          label={element.taskStatusName || 'A Fazer'}
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: '11px',
            borderColor: '#cbd5e1',
            color: 'text.secondary',
          }}
        />
        <span style={{ fontSize: 11, color: '#94a3b8' }}>🔗 Vinculada</span>
      </Box>
    </div>
  );
};
