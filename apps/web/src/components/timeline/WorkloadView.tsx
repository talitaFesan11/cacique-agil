'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ganttApi } from '@/lib/api-client';

interface WorkloadViewProps {
  projectId: string;
}

export function WorkloadView({ projectId }: WorkloadViewProps) {
  const t = useTranslations('workload');

  const { data: workload, isLoading, error } = useQuery({
    queryKey: ['workload', projectId],
    queryFn: () => ganttApi.getWorkload(projectId),
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (error || !workload) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Erro ao carregar carga de trabalho da equipe.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }} data-testid="workload-container">
      {/* Alerta de Tarefas não atribuídas */}
      {workload.unassignedTaskCount > 0 && (
        <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
          <strong>{t('unassigned')}</strong>{' '}
          {t('unassignedCount', {
            count: workload.unassignedTaskCount,
            hours: Math.round(workload.unassignedMinutes / 60),
          })}
        </Alert>
      )}

      {/* Cartões por Membro da Equipe */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {workload.members.map((member) => {
          const totalHoursAllocated = (member.totalAllocatedMinutes / 60).toFixed(1);
          const totalHoursCapacity = (member.totalCapacityMinutes / 60).toFixed(1);
          const utilizationPercent =
            member.totalCapacityMinutes > 0
              ? Math.min(200, Math.round((member.totalAllocatedMinutes / member.totalCapacityMinutes) * 100))
              : 0;

          return (
            <Card
              key={member.userId}
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: member.isOverallocated ? 'error.light' : 'divider',
                bgcolor: member.isOverallocated ? 'rgba(239, 68, 68, 0.02)' : 'background.paper',
              }}
              data-testid={`workload-card-${member.userId}`}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38 }}>
                      {member.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {member.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.taskCount} tarefa(s) atribuída(s)
                      </Typography>
                    </Box>
                  </Box>

                  {member.isOverallocated ? (
                    <Chip
                      icon={<WarningAmberIcon />}
                      size="small"
                      color="error"
                      label={t('overallocatedAlert')}
                      sx={{ fontWeight: 600 }}
                    />
                  ) : (
                    <Chip
                      icon={<CheckCircleOutlineIcon />}
                      size="small"
                      color="success"
                      variant="outlined"
                      label={t('normalCapacity')}
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                </Box>

                {/* Barra de Progresso de Capacidade */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {totalHoursAllocated}h alocadas / {totalHoursCapacity}h capacidade total
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: member.isOverallocated ? 'error.main' : 'text.primary',
                      }}
                    >
                      {utilizationPercent}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, utilizationPercent)}
                    color={member.isOverallocated ? 'error' : utilizationPercent > 80 ? 'warning' : 'primary'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {/* Histórico diário resumido */}
                <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', py: 0.5 }}>
                  {member.days.map((day) => {
                    const dayHours = (day.allocatedMinutes / 60).toFixed(1);
                    return (
                      <Box
                        key={day.date}
                        sx={{
                          minWidth: 32,
                          textAlign: 'center',
                          p: 0.5,
                          borderRadius: 1,
                          bgcolor: day.isOverallocated
                            ? 'error.light'
                            : day.allocatedMinutes > 0
                              ? 'primary.light'
                              : 'action.hover',
                          color: day.isOverallocated || day.allocatedMinutes > 0 ? '#fff' : 'text.secondary',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: '0.625rem', display: 'block', fontWeight: 600 }}>
                          {day.date.slice(8)}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.625rem', display: 'block' }}>
                          {dayHours}h
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
