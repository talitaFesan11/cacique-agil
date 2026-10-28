'use client';

import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectDto, ProjectStatus, WorkspaceRole } from '@fluxo/shared';
import { useAuthStore } from '@/features/auth/auth-store';
import { projectsApi } from '@/lib/api-client';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';

export default function ProjectsPage() {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId || w.slug === activeWorkspaceId) ||
    workspaces[0] ||
    null;

  const canWrite =
    activeWorkspace?.role && activeWorkspace.role !== WorkspaceRole.GUEST;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);

  const {
    data: projects,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', activeWorkspace?.id],
    queryFn: () => projectsApi.listByWorkspace(activeWorkspace!.id),
    enabled: Boolean(activeWorkspace?.id),
  });

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, search, statusFilter]);

  const getStatusLabel = (st: ProjectStatus) => {
    switch (st) {
      case ProjectStatus.PLANNING:
        return t('statusPlanning');
      case ProjectStatus.ACTIVE:
        return t('statusActive');
      case ProjectStatus.ON_HOLD:
        return t('statusOnHold');
      case ProjectStatus.COMPLETED:
        return t('statusCompleted');
      case ProjectStatus.ARCHIVED:
        return t('statusArchived');
      default:
        return st;
    }
  };

  const getStatusColor = (
    st: ProjectStatus,
  ): 'default' | 'primary' | 'success' | 'warning' | 'info' => {
    switch (st) {
      case ProjectStatus.ACTIVE:
        return 'primary';
      case ProjectStatus.COMPLETED:
        return 'success';
      case ProjectStatus.ON_HOLD:
        return 'warning';
      case ProjectStatus.PLANNING:
        return 'info';
      default:
        return 'default';
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectsApi.remove(projectId);
      await queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspace?.id] });
    } catch {
      // erro tratado pelo estado da query
    }
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      {/* Cabeçalho */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 0.5 }}>
            {t('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('subtitle')}
          </Typography>
        </Box>

        {canWrite && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingProject(null);
              setDialogOpen(true);
            }}
            data-testid="new-project-button"
          >
            {t('newProject')}
          </Button>
        )}
      </Box>

      {/* Barra de Busca e Filtro por Status */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 260, bgcolor: 'background.paper' }}
          inputProps={{ 'data-testid': 'projects-search-input' }}
        />

        <TextField
          select
          size="small"
          label={t('statusLabel')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 200, bgcolor: 'background.paper' }}
        >
          <MenuItem value="ALL">{t('allStatuses')}</MenuItem>
          <MenuItem value={ProjectStatus.PLANNING}>{t('statusPlanning')}</MenuItem>
          <MenuItem value={ProjectStatus.ACTIVE}>{t('statusActive')}</MenuItem>
          <MenuItem value={ProjectStatus.ON_HOLD}>{t('statusOnHold')}</MenuItem>
          <MenuItem value={ProjectStatus.COMPLETED}>{t('statusCompleted')}</MenuItem>
          <MenuItem value={ProjectStatus.ARCHIVED}>{t('statusArchived')}</MenuItem>
        </TextField>
      </Box>

      {/* Estados: Loading / Error / Empty / Lista */}
      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item}>
              <Skeleton variant="rounded" height={220} />
            </Grid>
          ))}
        </Grid>
      ) : isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              {tCommon('status.retry')}
            </Button>
          }
        >
          {error instanceof Error ? error.message : tCommon('status.error')}
        </Alert>
      ) : filteredProjects.length === 0 ? (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 6, px: 3 }}>
          <FolderOpenIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 1.5 }} />
          <Typography variant="h3" sx={{ fontSize: '1.25rem', mb: 1 }}>
            {t('emptyTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('emptySubtitle')}
          </Typography>
          {canWrite && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingProject(null);
                setDialogOpen(true);
              }}
            >
              {t('newProject')}
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => {
            const total = project.taskCount || 0;
            const completed = project.completedTaskCount || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={project.id}>
                <Card
                  variant="outlined"
                  data-testid={`project-card-${project.key}`}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderTop: 4,
                    borderTopColor: project.color || 'primary.main',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1.5,
                      }}
                    >
                      <Chip
                        label={project.key}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: project.color || 'primary.main',
                          color: '#fff',
                        }}
                      />
                      <Chip
                        label={getStatusLabel(project.status)}
                        color={getStatusColor(project.status)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="h3" sx={{ fontSize: '1.2rem', mb: 1 }}>
                      {project.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2.5, minHeight: 40 }}
                    >
                      {project.description || '—'}
                    </Typography>

                    <Box sx={{ mt: 'auto' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {t('tasksProgress', { completed, total })}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {pct}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </CardContent>

                  <CardActions
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderTop: 1,
                      borderColor: 'divider',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Button
                      component={Link}
                      href={`/${locale}/projects/${project.id}`}
                      size="small"
                      variant="contained"
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                      data-testid={`open-project-${project.key}`}
                    >
                      {t('openTaskList')}
                    </Button>

                    {canWrite && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          aria-label={t('editProject')}
                          onClick={() => {
                            setEditingProject(project);
                            setDialogOpen(true);
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={t('deleteProject')}
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {activeWorkspace && (
        <CreateProjectDialog
          open={dialogOpen}
          workspaceId={activeWorkspace.id}
          projectToEdit={editingProject}
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspace.id] });
          }}
        />
      )}
    </Box>
  );
}
