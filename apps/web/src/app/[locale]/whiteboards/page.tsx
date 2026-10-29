'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import GestureIcon from '@mui/icons-material/Gesture';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/auth-store';
import { whiteboardsApi, projectsApi } from '@/lib/api-client';
import { ProjectDto, WhiteboardTemplateCategory } from '@fluxo/shared';

export default function WhiteboardsPage() {
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();

  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId || w.slug === activeWorkspaceId) ||
    workspaces[0];

  const workspaceId = activeWorkspace?.id || '';

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Modal de Criação
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newCategory, setNewCategory] = useState<WhiteboardTemplateCategory | ''>('');

  // Queries
  const { data: whiteboards = [], isLoading } = useQuery({
    queryKey: ['whiteboards', workspaceId],
    queryFn: () => whiteboardsApi.list(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const { data: projects = [] } = useQuery<ProjectDto[]>({
    queryKey: ['workspace-projects', workspaceId],
    queryFn: () => projectsApi.listByWorkspace(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const filteredBoards = whiteboards.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase()));

    const matchesProject =
      selectedProjectId === 'all' ||
      (selectedProjectId === 'none' && !b.projectId) ||
      b.projectId === selectedProjectId;

    return matchesSearch && matchesProject;
  });

  const handleCreateBoard = async () => {
    if (!newTitle.trim() || !workspaceId) return;

    try {
      const created = await whiteboardsApi.create({
        workspaceId,
        projectId: newProjectId || undefined,
        title: newTitle.trim(),
        templateCategory: (newCategory as WhiteboardTemplateCategory) || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['whiteboards', workspaceId] });
      setCreateDialogOpen(false);
      setNewTitle('');
      setNewProjectId('');
      setNewCategory('');

      router.push(`/${locale}/whiteboards/${created.id}`);
    } catch {
      alert('Falha ao criar quadro branco.');
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir este quadro branco?')) return;

    try {
      await whiteboardsApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['whiteboards', workspaceId] });
    } catch {
      alert('Falha ao excluir quadro branco.');
    }
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Top Banner / Título */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GestureIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Quadros Brancos
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Espaço infinito colaborativo para diagramas, fluxogramas, ideação ágil e conversão em tarefas.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ textTransform: 'none', px: 2.5, fontWeight: 600 }}
        >
          Novo Quadro
        </Button>
      </Box>

      {/* Barra de Filtros e Busca */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Buscar quadros por título..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            },
          }}
          sx={{ width: { xs: '100%', sm: 300 } }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por Projeto</InputLabel>
          <Select
            value={selectedProjectId}
            label="Filtrar por Projeto"
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <MenuItem value="all">Todos os Projetos</MenuItem>
            <MenuItem value="none">Geral (Sem Projeto)</MenuItem>
            {projects.map((p: ProjectDto) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} ({p.key})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Grid de Quadros */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredBoards.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <GestureIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Nenhum quadro branco encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crie um novo quadro para brainstorming, mapas mentais ou fluxogramas integrados com o Cacique Ágil.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Criar Primeiro Quadro
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredBoards.map((board) => (
            <Grid item xs={12} sm={6} md={4} key={board.id}>
              <Card
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/${locale}/whiteboards/${board.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/${locale}/whiteboards/${board.id}`);
                  }
                }}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 4,
                    borderColor: 'primary.main',
                  },
                }}
              >
                {/* Preview Header / Thumbnail */}
                <Box
                  sx={{
                    height: 120,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                  }}
                >
                  <GestureIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7 }} />
                  {board.templateCategory && (
                    <Chip
                      label={board.templateCategory}
                      size="small"
                      color="secondary"
                      sx={{ position: 'absolute', top: 8, right: 8, fontSize: 10, height: 20 }}
                    />
                  )}
                </Box>

                <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                      {board.title}
                    </Typography>
                    <Tooltip title="Excluir Quadro">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteBoard(e, board.id)}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' }, mt: -0.5, mr: -0.5 }}
                        aria-label="Excluir Quadro"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {board.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: 13 }}>
                      {board.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', pt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`${board.elementsCount} elementos`}
                      size="small"
                      sx={{ height: 20, fontSize: 11 }}
                    />
                    {board.linkedTasksCount > 0 && (
                      <Chip
                        label={`🔗 ${board.linkedTasksCount} tarefas`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: 11 }}
                      />
                    )}
                    {board.project && (
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {board.project.key}
                      </span>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de Criação */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Quadro Branco</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            label="Título do Quadro"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: Arquitetura do Sistema, Brainstorming..."
            sx={{ mb: 2.5, mt: 1 }}
          />

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel>Vincular ao Projeto (Opcional)</InputLabel>
            <Select
              value={newProjectId}
              label="Vincular ao Projeto (Opcional)"
              onChange={(e) => setNewProjectId(e.target.value)}
            >
              <MenuItem value="">Nenhum (Quadro do Workspace)</MenuItem>
              {projects.map((p: ProjectDto) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Iniciar a partir de um Modelo</InputLabel>
            <Select
              value={newCategory}
              label="Iniciar a partir de um Modelo"
              onChange={(e) => setNewCategory(e.target.value as WhiteboardTemplateCategory)}
            >
              <MenuItem value="">Em Branco (Tela Limpa)</MenuItem>
              <MenuItem value="brainstorming">💡 Brainstorming (Colunas & Post-its)</MenuItem>
              <MenuItem value="mindmap">🧠 Mapa Mental (Nó Central & Ramos)</MenuItem>
              <MenuItem value="flowchart">🔀 Fluxograma (Processos & Decisões)</MenuItem>
              <MenuItem value="retrospective">🔄 Retrospectiva Ágil (O que correu bem...)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateBoard}
            disabled={!newTitle.trim()}
            sx={{ textTransform: 'none', px: 3 }}
          >
            Criar Quadro
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
