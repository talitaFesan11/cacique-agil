'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { whiteboardsApi, tasksApi, projectsApi, workspacesApi } from '@/lib/api-client';
import { WhiteboardCanvas } from '@/components/whiteboard/WhiteboardCanvas';
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer';

export default function WhiteboardEditorPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();

  const whiteboardId = (params?.whiteboardId as string) || '';

  // Gaveta lateral de detalhes da tarefa
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Consulta do quadro branco
  const {
    data: whiteboard,
    isLoading: loadingWhiteboard,
    isError,
  } = useQuery({
    queryKey: ['whiteboard', whiteboardId],
    queryFn: () => whiteboardsApi.getById(whiteboardId),
    enabled: Boolean(whiteboardId),
  });

  const workspaceId = whiteboard?.workspaceId || '';
  const projectId = whiteboard?.projectId || '';

  // Consulta das tarefas do projeto associado (para inserção no quadro)
  const { data: projectTasks = [] } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => tasksApi.listByProject(projectId),
    enabled: Boolean(projectId),
  });

  // Consulta dos detalhes do projeto (statuses)
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: Boolean(projectId),
  });

  // Consulta de etiquetas e membros para o TaskDetailDrawer
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

  if (loadingWhiteboard) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !whiteboard) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <h2>Quadro branco não encontrado</h2>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/${locale}/whiteboards`)}
        >
          Voltar para Quadros
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <WhiteboardCanvas
        whiteboard={whiteboard}
        projectTasks={projectTasks}
        onOpenTaskDetail={(taskId) => setSelectedTaskId(taskId)}
      />

      {/* Drawer de detalhes da tarefa quando clicada no canvas */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          workspaceId={workspaceId}
          projectId={projectId}
          statuses={project?.statuses || []}
          labels={labels}
          members={members}
          canWrite={true}
          onClose={() => setSelectedTaskId(null)}
          onTaskChanged={() => {
            queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
          }}
          onSelectSubtask={(subtaskId) => setSelectedTaskId(subtaskId)}
        />
      )}
    </Box>
  );
}
