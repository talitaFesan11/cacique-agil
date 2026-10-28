'use client';

import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import DiamondIcon from '@mui/icons-material/Diamond';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  addDays,
  isWeekend,
  parseDate,
  startOfDay,
  StatusCategory,
  TaskDto,
  toIsoDate,
} from '@fluxo/shared';
import { tasksApi } from '@/lib/api-client';

interface TaskCalendarViewProps {
  projectId: string;
  onOpenTaskDetail: (taskId: string) => void;
  canWrite: boolean;
}

export function TaskCalendarView({
  projectId,
  onOpenTaskDetail,
  canWrite: _canWrite,
}: TaskCalendarViewProps) {
  const t = useTranslations('calendar');

  const [currentDate, setCurrentDate] = useState<Date>(() => startOfDay(new Date()));
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Buscar todas as tarefas do projeto
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.listByProject(projectId),
  });

  // Navegação temporal
  const handlePrev = () => {
    if (viewMode === 'month') {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const handleToday = () => {
    setCurrentDate(startOfDay(new Date()));
  };

  // Calcular dias exibidos no calendário
  const calendarDays = useMemo(() => {
    if (viewMode === 'week') {
      const dayOfWeek = currentDate.getDay(); // 0 = Domingo
      const startOfWeek = addDays(currentDate, -dayOfWeek);
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        days.push(addDays(startOfWeek, i));
      }
      return days;
    }

    // Modo Mês: grade completa de 35 ou 42 dias
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const startDate = addDays(firstDayOfMonth, -startDayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 35; i++) {
      days.push(addDays(startDate, i));
    }
    return days;
  }, [currentDate, viewMode]);

  // Indexar tarefas por data (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskDto[]>();
    for (const task of tasks) {
      if (task.dueDate) {
        const key = toIsoDate(task.dueDate);
        const list = map.get(key) || [];
        list.push(task);
        map.set(key, list);
      } else if (task.startDate) {
        const key = toIsoDate(task.startDate);
        const list = map.get(key) || [];
        list.push(task);
        map.set(key, list);
      }
    }
    return map;
  }, [tasks]);

  const todayStr = toIsoDate(new Date());

  const monthTitle = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const weekDayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (isLoading) {
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Erro ao carregar tarefas do calendário.</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
      data-testid="calendar-container"
    >
      {/* Barra Superior de Navegação */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          p: 1.5,
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={handlePrev} data-testid="calendar-prev-button">
              <ChevronLeftIcon fontSize="small" />
            </Button>
            <Button onClick={handleToday} startIcon={<TodayIcon fontSize="small" />} data-testid="calendar-today-button">
              {t('today')}
            </Button>
            <Button onClick={handleNext} data-testid="calendar-next-button">
              <ChevronRightIcon fontSize="small" />
            </Button>
          </ButtonGroup>

          <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 700, ml: 1 }}>
            {monthTitle}
          </Typography>
        </Box>

        <ToggleButtonGroup
          size="small"
          value={viewMode}
          exclusive
          onChange={(_, val) => val && setViewMode(val)}
          data-testid="calendar-view-mode"
        >
          <ToggleButton value="month" data-testid="calendar-mode-month">
            {t('month')}
          </ToggleButton>
          <ToggleButton value="week" data-testid="calendar-mode-week">
            {t('week')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Cabeçalho dos Dias da Semana */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: 2,
          borderColor: 'divider',
          bgcolor: 'background.default',
          textAlign: 'center',
          py: 1,
          fontWeight: 700,
          fontSize: '0.8125rem',
          color: 'text.secondary',
        }}
      >
        {weekDayHeaders.map((day, idx) => (
          <Box key={day} sx={{ color: idx === 0 || idx === 6 ? 'text.secondary' : 'text.primary' }}>
            {day}
          </Box>
        ))}
      </Box>

      {/* Grid de Dias */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: viewMode === 'month' ? 'minmax(110px, 1fr)' : 'minmax(350px, 1fr)',
          bgcolor: 'divider',
          gap: '1px',
        }}
      >
        {calendarDays.map((date, idx) => {
          const dateStr = toIsoDate(date);
          const isToday = dateStr === todayStr;
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const weekend = isWeekend(date);
          const dayTasks = tasksByDate.get(dateStr) || [];

          return (
            <Box
              key={idx}
              sx={{
                bgcolor: weekend ? 'action.hover' : 'background.paper',
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                opacity: isCurrentMonth || viewMode === 'week' ? 1 : 0.45,
                position: 'relative',
                overflow: 'hidden',
              }}
              data-testid={`calendar-day-${dateStr}`}
            >
              {/* Número do Dia */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isToday ? 800 : 600,
                    fontSize: '0.8125rem',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: isToday ? 'primary.main' : 'transparent',
                    color: isToday ? '#fff' : 'text.primary',
                  }}
                >
                  {date.getDate()}
                </Typography>
                {dayTasks.length > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    {dayTasks.length}
                  </Typography>
                )}
              </Box>

              {/* Lista de Chips de Tarefas no Dia */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, overflowY: 'auto', flex: 1 }}>
                {dayTasks.map((task) => {
                  const isDone = task.status?.category === StatusCategory.DONE;
                  const isOverdue =
                    !isDone && task.dueDate && parseDate(task.dueDate)! < startOfDay(new Date());

                  return (
                    <Tooltip
                      key={task.id}
                      title={`${task.key}: ${task.title} • Status: ${task.status?.name || 'A Fazer'}`}
                    >
                      <Box
                        onClick={() => onOpenTaskDetail(task.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          p: '3px 6px',
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          bgcolor: isOverdue
                            ? 'error.light'
                            : isDone
                              ? 'success.light'
                              : task.isMilestone
                                ? '#8b5cf6'
                                : 'primary.main',
                          color: '#fff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          transition: 'transform 0.1s ease',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            filter: 'brightness(1.1)',
                          },
                        }}
                        data-testid={`calendar-task-${task.key}`}
                      >
                        {task.isMilestone && <DiamondIcon sx={{ fontSize: 11 }} />}
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#fff' }}
                        >
                          {task.key}
                        </Typography>
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.9)' }}
                        >
                          {task.title}
                        </Typography>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
