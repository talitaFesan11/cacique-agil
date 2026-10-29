'use client';

import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import AddTaskIcon from '@mui/icons-material/AddTask';
import SearchIcon from '@mui/icons-material/Search';
import { TaskDto } from '@fluxo/shared';

interface WhiteboardTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  tasks: TaskDto[];
  onAddTaskToCanvas: (task: TaskDto) => void;
  existingTaskIds: string[];
}

export const WhiteboardTaskDrawer: React.FC<WhiteboardTaskDrawerProps> = ({
  open,
  onClose,
  tasks,
  onAddTaskToCanvas,
  existingTaskIds,
}) => {
  const [search, setSearch] = useState('');

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.key.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 360, p: 2 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
          Tarefas do Projeto
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Insira cartões de tarefas no quadro para planejar visualmente e criar conexões.
      </Typography>

      <TextField
        size="small"
        fullWidth
        placeholder="Buscar tarefa por título ou chave..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
        }}
        sx={{ mb: 2 }}
      />

      <List sx={{ overflowY: 'auto', flex: 1, p: 0 }}>
        {filteredTasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            Nenhuma tarefa encontrada.
          </Box>
        ) : (
          filteredTasks.map((task) => {
            const isAlreadyOnCanvas = existingTaskIds.includes(task.id);

            return (
              <ListItem
                key={task.id}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  mb: 1.5,
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  bgcolor: isAlreadyOnCanvas ? 'rgba(99, 102, 241, 0.04)' : '#ffffff',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {task.key}
                  </Typography>
                  <Chip
                    label={task.status?.name || 'A Fazer'}
                    size="small"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {task.title}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    Prioridade: {task.priority}
                  </span>

                  <Button
                    size="small"
                    variant={isAlreadyOnCanvas ? 'outlined' : 'contained'}
                    startIcon={<AddTaskIcon />}
                    onClick={() => onAddTaskToCanvas(task)}
                    sx={{ textTransform: 'none', fontSize: 12, py: 0.2 }}
                  >
                    {isAlreadyOnCanvas ? 'Adicionar +' : 'Inserir'}
                  </Button>
                </Box>
              </ListItem>
            );
          })
        )}
      </List>
    </Drawer>
  );
};
