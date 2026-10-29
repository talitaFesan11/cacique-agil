'use client';

import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TimelineIcon from '@mui/icons-material/Timeline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';
import GestureIcon from '@mui/icons-material/Gesture';
import GroupIcon from '@mui/icons-material/Group';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SavedViewConfigDto,
  SavedViewDto,
  TaskPriority,
  WorkspaceRole,
} from '@fluxo/shared';
import { useAuthStore } from '@/features/auth/auth-store';
import { documentsApi, projectsApi, tasksApi, workspacesApi } from '@/lib/api-client';
import {
  ActiveTaskFilters,
  TaskFiltersBar,
} from '@/components/tasks/TaskFiltersBar';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskKanbanView } from '@/components/kanban/TaskKanbanView';
import { TaskGanttView } from '@/components/gantt/TaskGanttView';
import { TaskCalendarView } from '@/components/calendar/TaskCalendarView';
import { WorkloadView } from '@/components/timeline/WorkloadView';
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { KeyboardShortcutsDialog } from '@/components/tasks/KeyboardShortcutsDialog';
import { useProjectRealtime } from '@/features/realtime/use-project-realtime';
import { PresenceBar } from '@/features/realtime/PresenceBar';

export default function ProjectTasksPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = String(params?.projectId || '');
  const router = useRouter();

  const t = useTranslations('tasks');
  const tProjects = useTranslations('projects');
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

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [filters, setFilters] = useState<ActiveTaskFilters>({
    search: '',
    statusId: '',
    priority: '',
    labelId: '',
    assigneeId: '',
    groupBy: 'status',
  });
  const [activeTab, setActiveTab] = useState<'list' | 'kanban' | 'gantt' | 'calendar' | 'workload' | 'docs'>('list');
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Tempo real via Socket.IO e Presença
  const { isConnected, activeUsers } = useProjectRealtime(projectId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view') as 'list' | 'kanban' | 'gantt' | 'calendar' | 'workload' | 'docs' | null;
      if (view && ['list', 'kanban', 'gantt', 'calendar', 'workload', 'docs'].includes(view)) {
        setActiveTab(view);
      }
    }
  }, []);

  const handleTabChange = (
    _: React.SyntheticEvent,
    nextTab: 'list' | 'kanban' | 'gantt' | 'calendar' | 'workload' | 'docs',
  ) => {
    setActiveTab(nextTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', nextTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Queries do projeto, tarefas, etiquetas, membros e visões salvas
  const {
    data: project,
    isLoading: loadingProject,
    isError: isProjectError,
    error: projectError,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: Boolean(projectId),
  });

  const workspaceId = project?.workspaceId || activeWorkspace?.id || '';

  const { data: projectDocs = [], refetch: refetchProjectDocs } = useQuery({
    queryKey: ['project-docs', projectId],
    queryFn: () => documentsApi.list(workspaceId, { projectId }),
    enabled: Boolean(workspaceId) && activeTab === 'docs',
  });

  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: [
      'project-tasks',
      projectId,
      filters.search,
      filters.statusId,
      filters.priority,
      filters.labelId,
      filters.assigneeId,
    ],
    queryFn: () =>
      tasksApi.listByProject(projectId, {
        search: filters.search || undefined,
        statusId: filters.statusId || undefined,
        priority: (filters.priority as TaskPriority) || undefined,
        labelId: filters.labelId || undefined,
        assigneeId: filters.assigneeId || undefined,
      }),
    enabled: Boolean(projectId),
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['workspace-labels', workspaceId],
    queryFn: () => projectsApi.listWorkspaceLabels(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspacesApi.listMembers(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const { data: savedViews = [] } = useQuery({
    queryKey: ['saved-views', projectId],
    queryFn: () => projectsApi.listSavedViews(projectId),
    enabled: Boolean(projectId),
  });

  // Atalhos globais de teclado ('C' criar, '/' buscar, 'Esc' fechar, '?' ajuda)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        if (selectedTaskId) setSelectedTaskId(null);
        if (createTaskOpen) setCreateTaskOpen(false);
        if (shortcutsOpen) setShortcutsOpen(false);
        return;
      }

      if (isEditable || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        if (canWrite) {
          e.preventDefault();
          setCreateTaskOpen(true);
        }
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canWrite, createTaskOpen, selectedTaskId, shortcutsOpen]);

  const statuses = project?.statuses || [];

  const handleSelectSavedView = (view: SavedViewDto) => {
    setActiveSavedViewId(view.id);
    setFilters({
      search: view.config.search || '',
      statusId: view.config.statusId || '',
      priority: view.config.priority || '',
      labelId: view.config.labelId || '',
      assigneeId: view.config.assigneeId || '',
      groupBy: view.config.groupBy || 'status',
    });
  };

  const handleCreateSavedView = async (
    name: string,
    shared: boolean,
    config: SavedViewConfigDto,
  ) => {
    const created = await projectsApi.createSavedView(projectId, {
      name,
      type: 'LIST',
      shared,
      config,
    });
    setActiveSavedViewId(created.id);
    await queryClient.invalidateQueries({ queryKey: ['saved-views', projectId] });
  };

  const handleDeleteSavedView = async (viewId: string) => {
    await projectsApi.deleteSavedView(viewId);
    if (activeSavedViewId === viewId) {
      setActiveSavedViewId(null);
    }
    await queryClient.invalidateQueries({ queryKey: ['saved-views', projectId] });
  };

  const handleQuickCreateTask = async (title: string, statusId?: string) => {
    await tasksApi.create(projectId, {
      title,
      statusId,
      priority: TaskPriority.MEDIUM,
      assigneeIds: [],
    });
    await refetchTasks();
    await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  };

  const handleInlineUpdateTask = async (
    taskId: string,
    patch: { statusId?: string; priority?: TaskPriority; title?: string },
  ) => {
    await tasksApi.update(taskId, patch);
    await refetchTasks();
    await queryClient.invalidateQueries({ queryKey: ['task-detail', taskId] });
    await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  };

  const handleBulkAction = async (action: {
    taskIds: string[];
    statusId?: string;
    priority?: TaskPriority;
    delete?: boolean;
  }) => {
    await tasksApi.bulkAction(action);
    await refetchTasks();
    await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  };

  if (loadingProject) {
    return (
      <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
        <Skeleton variant="rounded" height={84} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={110} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={340} />
      </Box>
    );
  }

  if (isProjectError || !project) {
    return (
      <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
        <Alert severity="error">
          {projectError instanceof Error
            ? projectError.message
            : tCommon('status.error')}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
      {/* Cabeçalho do Projeto */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            href={`/${locale}/projects`}
            size="small"
            color="inherit"
            startIcon={<ArrowBackIcon fontSize="small" />}
          >
            {tProjects('title')}
          </Button>

          <Chip
            label={project.key}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: project.color || 'primary.main',
              color: '#fff',
            }}
          />

          <Typography
            variant="h1"
            sx={{ fontSize: { xs: '1.35rem', md: '1.75rem' }, color: 'text.primary', fontWeight: 700 }}
          >
            {project.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Barra de Presença em Tempo Real */}
          <PresenceBar isConnected={isConnected} activeUsers={activeUsers} />

          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<KeyboardIcon fontSize="small" />}
            onClick={() => setShortcutsOpen(true)}
            data-testid="open-shortcuts-button"
          >
            {t('shortcutsButton')}
          </Button>

          {canWrite && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateTaskOpen(true)}
              data-testid="open-create-task-modal-button"
            >
              {t('newTask')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Abas de Visão do Projeto (Seção 7 da Spec) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            value="list"
            icon={<FormatListBulletedIcon fontSize="small" />}
            iconPosition="start"
            label={t('viewList')}
            data-testid="tab-list"
          />
          <Tab
            value="kanban"
            icon={<ViewKanbanIcon fontSize="small" />}
            iconPosition="start"
            label={t('viewKanban')}
            data-testid="tab-kanban"
          />
          <Tab
            value="gantt"
            icon={<TimelineIcon fontSize="small" />}
            iconPosition="start"
            label={t('viewGantt')}
            data-testid="tab-gantt"
          />
          <Tab
            value="calendar"
            icon={<CalendarMonthIcon fontSize="small" />}
            iconPosition="start"
            label={t('viewCalendar')}
            data-testid="tab-calendar"
          />
          <Tab
            value="workload"
            icon={<GroupIcon fontSize="small" />}
            iconPosition="start"
            label={t('viewWorkload')}
            data-testid="tab-workload"
          />
          <Tab
            value="docs"
            icon={<DescriptionIcon fontSize="small" />}
            iconPosition="start"
            label={t('viewDocs')}
            data-testid="tab-docs"
          />
          <Tab
            value="whiteboard"
            disabled
            icon={<GestureIcon fontSize="small" />}
            iconPosition="start"
            label={t('viewWhiteboard')}
          />
        </Tabs>
      </Box>

      {/* Barra de Filtros, Busca, Agrupamento e Visões Salvas (nas visões de lista e kanban) */}
      {(activeTab === 'list' || activeTab === 'kanban') && (
        <TaskFiltersBar
          filters={filters}
          onChangeFilters={(next) => {
            setActiveSavedViewId(null);
            setFilters(next);
          }}
          statuses={statuses}
          labels={labels}
          members={members}
          savedViews={savedViews}
          activeSavedViewId={activeSavedViewId}
          onSelectSavedView={handleSelectSavedView}
          onCreateSavedView={handleCreateSavedView}
          onDeleteSavedView={handleDeleteSavedView}
          searchInputRef={searchInputRef}
          canWrite={Boolean(canWrite)}
        />
      )}

      {/* Visão de Tarefas: Lista, Kanban, Gantt, Calendário ou Carga de Trabalho */}
      {loadingTasks ? (
        <Skeleton variant="rounded" height={320} />
      ) : activeTab === 'kanban' ? (
        <TaskKanbanView
          tasks={tasks}
          statuses={statuses}
          members={members}
          selectedTaskId={selectedTaskId}
          onSelectTask={(id) => setSelectedTaskId(id)}
          onMoveTask={async (taskId, patch) => {
            await tasksApi.move(taskId, patch);
            await refetchTasks();
            await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          }}
          onQuickCreateTask={handleQuickCreateTask}
          onCreateStatus={async (input) => {
            await projectsApi.createStatus(projectId, input);
            await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          }}
          onUpdateStatus={async (statusId, input) => {
            await projectsApi.updateStatus(projectId, statusId, input);
            await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          }}
          onDeleteStatus={async (statusId) => {
            await projectsApi.deleteStatus(projectId, statusId);
            await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          }}
          canWrite={Boolean(canWrite)}
        />
      ) : activeTab === 'gantt' ? (
        <Box sx={{ mt: 1.5 }}>
          <TaskGanttView
            projectId={projectId}
            canWrite={Boolean(canWrite)}
            onOpenTaskDetail={(taskId) => setSelectedTaskId(taskId)}
          />
        </Box>
      ) : activeTab === 'calendar' ? (
        <TaskCalendarView
          projectId={projectId}
          canWrite={Boolean(canWrite)}
          onOpenTaskDetail={(taskId) => setSelectedTaskId(taskId)}
        />
      ) : activeTab === 'workload' ? (
        <WorkloadView projectId={projectId} />
      ) : activeTab === 'docs' ? (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Documentos do Projeto ({projectDocs.length})
            </Typography>
            {canWrite && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={async () => {
                  try {
                    const newDoc = await documentsApi.create({
                      workspaceId,
                      projectId,
                      title: 'Nova Página do Projeto',
                    });
                    refetchProjectDocs();
                    router.push(`/${locale}/docs/${newDoc.id}`);
                  } catch (err) {
                    console.error('Erro ao criar doc do projeto:', err);
                  }
                }}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                Novo Documento
              </Button>
            )}
          </Box>

          {projectDocs.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
              <DescriptionIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Nenhum documento associado a este projeto
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Crie especificações, atas e documentações técnicas vinculadas a este projeto.
              </Typography>
              {canWrite && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={async () => {
                    const newDoc = await documentsApi.create({
                      workspaceId,
                      projectId,
                      title: 'Documentação do Projeto',
                    });
                    refetchProjectDocs();
                    router.push(`/${locale}/docs/${newDoc.id}`);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Criar Primeiro Documento
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {projectDocs.map((d) => (
                <Box
                  key={d.id}
                  data-testid={`project-doc-card-${d.id}`}
                  onClick={() => router.push(`/${locale}/docs/${d.id}`)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography sx={{ fontSize: '1.5rem' }}>{d.icon || '📄'}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.title}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Atualizado em {new Date(d.updatedAt).toLocaleDateString('pt-BR')}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ) : (
        <TaskListView
          tasks={tasks}
          statuses={statuses}
          members={members}
          groupBy={filters.groupBy}
          selectedTaskId={selectedTaskId}
          onSelectTask={(taskId) => setSelectedTaskId(taskId)}
          onQuickCreateTask={handleQuickCreateTask}
          onInlineUpdateTask={handleInlineUpdateTask}
          onBulkAction={handleBulkAction}
          canWrite={Boolean(canWrite)}
        />
      )}

      {/* Drawer Lateral de Detalhes da Tarefa */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        workspaceId={workspaceId}
        projectId={projectId}
        statuses={statuses}
        labels={labels}
        members={members}
        canWrite={Boolean(canWrite)}
        onClose={() => setSelectedTaskId(null)}
        onTaskChanged={() => {
          refetchTasks();
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }}
        onSelectSubtask={(subtaskId) => setSelectedTaskId(subtaskId)}
      />

      {/* Modal de Nova Tarefa */}
      <CreateTaskDialog
        open={createTaskOpen}
        projectId={projectId}
        statuses={statuses}
        labels={labels}
        members={members}
        onClose={() => setCreateTaskOpen(false)}
        onCreated={(created) => {
          refetchTasks();
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          setSelectedTaskId(created.id);
        }}
      />

      {/* Modal de Ajuda de Atalhos de Teclado */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </Box>
  );
}
