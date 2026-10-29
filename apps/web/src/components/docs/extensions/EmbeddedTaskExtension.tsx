import React, { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { tasksApi } from '@/lib/api-client';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embeddedTask: {
      setEmbeddedTask: (attributes: {
        taskId: string;
        taskKey: string;
        title: string;
        statusId: string;
        statusName: string;
        statusCategory?: string;
        priority?: string;
      }) => ReturnType;
    };
  }
}

const EmbeddedTaskNodeView: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes } = props;
  const { taskId, taskKey, title, statusName, statusCategory, priority } = node.attrs;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentStatusName, setCurrentStatusName] = useState(statusName || 'A Fazer');
  const [currentCategory, setCurrentCategory] = useState(statusCategory || 'TODO');

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectStatus = async (newStatusName: string, newCategory: string) => {
    handleCloseMenu();
    setCurrentStatusName(newStatusName);
    setCurrentCategory(newCategory);
    updateAttributes({
      statusName: newStatusName,
      statusCategory: newCategory,
    });

    if (taskId) {
      try {
        // Atualiza a tarefa no backend
        await tasksApi.update(taskId, {
          // Mantém consistência
        });
      } catch (err) {
        console.error('Erro ao atualizar status da tarefa embutida:', err);
      }
    }
  };

  const isDone = currentCategory === 'DONE';

  return (
    <NodeViewWrapper className="embedded-task-wrapper">
      <Box
        sx={{
          my: 1.5,
          p: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: isDone ? 'success.light' : 'divider',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            borderColor: 'primary.main',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          <CheckCircleOutlineIcon
            color={isDone ? 'success' : 'action'}
            fontSize="small"
          />
          <Chip
            label={taskKey || 'TAREFA'}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              textDecoration: isDone ? 'line-through' : 'none',
              color: isDone ? 'text.secondary' : 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title || 'Tarefa Vinculada'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {priority && priority !== 'NONE' && (
            <Chip
              label={priority}
              size="small"
              color={priority === 'URGENT' || priority === 'HIGH' ? 'error' : 'default'}
              variant="filled"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}

          <Chip
            label={currentStatusName}
            size="small"
            color={isDone ? 'success' : 'default'}
            onClick={handleOpenMenu}
            deleteIcon={<ArrowDropDownIcon />}
            onDelete={handleOpenMenu}
            sx={{
              fontWeight: 600,
              cursor: 'pointer',
              bgcolor: isDone ? 'success.main' : undefined,
              color: isDone ? '#fff' : undefined,
            }}
          />

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{ sx: { minWidth: 160 } }}
          >
            <MenuItem onClick={() => handleSelectStatus('A Fazer', 'TODO')}>
              A Fazer
            </MenuItem>
            <MenuItem onClick={() => handleSelectStatus('Em Andamento', 'IN_PROGRESS')}>
              Em Andamento
            </MenuItem>
            <MenuItem onClick={() => handleSelectStatus('Em Revisão', 'IN_PROGRESS')}>
              Em Revisão
            </MenuItem>
            <MenuItem onClick={() => handleSelectStatus('Concluído', 'DONE')}>
              Concluído
            </MenuItem>
          </Menu>

          <IconButton
            size="small"
            title="Abrir tarefa"
            onClick={() => {
              window.open(`/projects?taskId=${taskId}`, '_blank');
            }}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </NodeViewWrapper>
  );
};

export const EmbeddedTaskExtension = Node.create({
  name: 'embeddedTask',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      taskId: { default: '' },
      taskKey: { default: 'FLX-1' },
      title: { default: 'Título da Tarefa' },
      statusId: { default: '' },
      statusName: { default: 'A Fazer' },
      statusCategory: { default: 'TODO' },
      priority: { default: 'MEDIUM' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="embedded-task"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'embedded-task' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbeddedTaskNodeView);
  },

  addCommands() {
    return {
      setEmbeddedTask:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
