'use client';

import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import DiamondIcon from '@mui/icons-material/Diamond';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { useLocale, useTranslations } from 'next-intl';
import {
  StatusCategory,
  TaskDto,
  TaskPriority,
  WorkflowStatusDto,
  WorkspaceMemberDto,
} from '@fluxo/shared';

interface TaskListViewProps {
  tasks: TaskDto[];
  statuses: WorkflowStatusDto[];
  members: WorkspaceMemberDto[];
  groupBy: 'status' | 'priority' | 'none';
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onQuickCreateTask: (title: string, statusId?: string) => Promise<void>;
  onInlineUpdateTask: (
    taskId: string,
    patch: { statusId?: string; priority?: TaskPriority; title?: string },
  ) => Promise<void>;
  onBulkAction: (action: {
    taskIds: string[];
    statusId?: string;
    priority?: TaskPriority;
    delete?: boolean;
  }) => Promise<void>;
  canWrite: boolean;
}

export function TaskListView({
  tasks,
  statuses,
  members,
  groupBy,
  selectedTaskId,
  onSelectTask,
  onQuickCreateTask,
  onInlineUpdateTask,
  onBulkAction,
  canWrite,
}: TaskListViewProps) {
  const t = useTranslations('tasks');
  const locale = useLocale();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const memberMap = useMemo(() => {
    const map = new Map<string, WorkspaceMemberDto['user']>();
    for (const m of members) {
      map.set(m.user.id, m.user);
    }
    return map;
  }, [members]);

  const getPriorityLabel = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.URGENT:
        return t('priorityUrgent');
      case TaskPriority.HIGH:
        return t('priorityHigh');
      case TaskPriority.MEDIUM:
        return t('priorityMedium');
      case TaskPriority.LOW:
        return t('priorityLow');
      default:
        return t('priorityNone');
    }
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.URGENT:
        return '#EF4444';
      case TaskPriority.HIGH:
        return '#F97316';
      case TaskPriority.MEDIUM:
        return '#F59E0B';
      case TaskPriority.LOW:
        return '#3B82F6';
      default:
        return '#94A3B8';
    }
  };

  const groups = useMemo(() => {
    if (groupBy === 'status') {
      return statuses.map((st) => ({
        id: st.id,
        title: st.name,
        color: st.color || '#64748B',
        tasks: tasks.filter((task) => task.statusId === st.id),
      }));
    }

    if (groupBy === 'priority') {
      const order: TaskPriority[] = [
        TaskPriority.URGENT,
        TaskPriority.HIGH,
        TaskPriority.MEDIUM,
        TaskPriority.LOW,
        TaskPriority.NONE,
      ];
      return order.map((prio) => ({
        id: prio,
        title: getPriorityLabel(prio),
        color: getPriorityColor(prio),
        tasks: tasks.filter((task) => task.priority === prio),
      }));
    }

    return [
      {
        id: 'all',
        title: t('viewList'),
        color: '#2563EB',
        tasks,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy, statuses, tasks, locale]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !canWrite) return;
    setQuickAdding(true);
    try {
      await onQuickCreateTask(quickTitle.trim(), statuses[0]?.id);
      setQuickTitle('');
    } finally {
      setQuickAdding(false);
    }
  };

  const toggleSelectTask = (taskId: string) => {
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map((tItem) => tItem.id));
    }
  };

  const formatShortDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return null;
    try {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
      }).format(new Date(dateStr));
    } catch {
      return null;
    }
  };

  const isOverdue = (task: TaskDto) => {
    if (!task.dueDate || task.progress === 100) return false;
    if (task.status?.category === StatusCategory.DONE) return false;
    return new Date(task.dueDate).getTime() < Date.now();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Barra de Adição Rápida Inline */}
      {canWrite && (
        <Paper
          component="form"
          onSubmit={handleQuickAdd}
          variant="outlined"
          sx={{
            p: 1.5,
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder={t('quickAddPlaceholder')}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            fullWidth
            inputProps={{ 'data-testid': 'quick-add-task-input' }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={quickAdding || !quickTitle.trim()}
            data-testid="quick-add-task-button"
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('quickAddButton')}
          </Button>
        </Paper>
      )}

      {/* Barra Contextual de Ações em Massa */}
      {canWrite && selectedIds.length > 0 && (
        <Paper
          variant="outlined"
          data-testid="bulk-actions-toolbar"
          sx={{
            p: 1.5,
            px: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            bgcolor: 'action.selected',
            borderColor: 'primary.main',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('bulkSelected', { count: selectedIds.length })}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <Select
              size="small"
              displayEmpty
              value=""
              onChange={async (e) => {
                const statusId = String(e.target.value);
                if (!statusId) return;
                await onBulkAction({ taskIds: selectedIds, statusId });
                setSelectedIds([]);
              }}
              sx={{ minWidth: 150, bgcolor: 'background.paper' }}
            >
              <MenuItem value="" disabled>
                {t('bulkChangeStatus')}
              </MenuItem>
              {statuses.map((st) => (
                <MenuItem key={st.id} value={st.id}>
                  {st.name}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              displayEmpty
              value=""
              onChange={async (e) => {
                const priority = e.target.value as TaskPriority;
                if (!priority) return;
                await onBulkAction({ taskIds: selectedIds, priority });
                setSelectedIds([]);
              }}
              sx={{ minWidth: 160, bgcolor: 'background.paper' }}
            >
              <MenuItem value="" disabled>
                {t('bulkChangePriority')}
              </MenuItem>
              <MenuItem value={TaskPriority.URGENT}>{t('priorityUrgent')}</MenuItem>
              <MenuItem value={TaskPriority.HIGH}>{t('priorityHigh')}</MenuItem>
              <MenuItem value={TaskPriority.MEDIUM}>{t('priorityMedium')}</MenuItem>
              <MenuItem value={TaskPriority.LOW}>{t('priorityLow')}</MenuItem>
              <MenuItem value={TaskPriority.NONE}>{t('priorityNone')}</MenuItem>
            </Select>

            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              onClick={async () => {
                await onBulkAction({ taskIds: selectedIds, delete: true });
                setSelectedIds([]);
              }}
              data-testid="bulk-delete-button"
            >
              {t('bulkDelete')}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Estado Vazio */}
      {tasks.length === 0 ? (
        <Paper variant="outlined" sx={{ textAlign: 'center', py: 6, px: 3 }}>
          <AssignmentOutlinedIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 1.5 }} />
          <Typography variant="h3" sx={{ fontSize: '1.15rem', mb: 0.5 }}>
            {t('emptyTasksTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('emptyTasksSubtitle')}
          </Typography>
        </Paper>
      ) : (
        groups.map((group) => {
          if (group.tasks.length === 0 && groupBy !== 'status') return null;

          return (
            <Paper key={group.id} variant="outlined" sx={{ overflow: 'hidden' }}>
              {/* Cabeçalho do Grupo */}
              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  bgcolor: 'action.hover',
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: group.color,
                  }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {group.title}
                </Typography>
                <Chip label={group.tasks.length} size="small" sx={{ height: 20 }} />
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {canWrite && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={
                              tasks.length > 0 && selectedIds.length === tasks.length
                            }
                            indeterminate={
                              selectedIds.length > 0 &&
                              selectedIds.length < tasks.length
                            }
                            onChange={toggleSelectAll}
                          />
                        </TableCell>
                      )}
                      <TableCell sx={{ width: 95, fontWeight: 600 }}>
                        {t('colKey')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t('colTitle')}</TableCell>
                      <TableCell sx={{ width: 160, fontWeight: 600 }}>
                        {t('colStatus')}
                      </TableCell>
                      <TableCell sx={{ width: 150, fontWeight: 600 }}>
                        {t('colPriority')}
                      </TableCell>
                      <TableCell sx={{ width: 170, fontWeight: 600 }}>
                        {t('colLabels')}
                      </TableCell>
                      <TableCell sx={{ width: 120, fontWeight: 600 }}>
                        {t('colAssignees')}
                      </TableCell>
                      <TableCell sx={{ width: 120, fontWeight: 600 }}>
                        {t('colDueDate')}
                      </TableCell>
                      <TableCell sx={{ width: 140, fontWeight: 600 }}>
                        {t('colIndicators')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.tasks.map((task) => {
                      const isRowSelected = selectedTaskId === task.id;
                      const isChecked = selectedIds.includes(task.id);
                      const taskOverdue = isOverdue(task);
                      const clTotal = task.checklistSummary?.totalItems || 0;
                      const clDone = task.checklistSummary?.completedItems || 0;

                      return (
                        <TableRow
                          key={task.id}
                          hover
                          selected={isRowSelected}
                          data-testid={`task-row-${task.key}`}
                          sx={{ cursor: 'pointer' }}
                        >
                          {canWrite && (
                            <TableCell
                              padding="checkbox"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                size="small"
                                checked={isChecked}
                                onChange={() => toggleSelectTask(task.id)}
                                inputProps={{
                                  'aria-label': task.key,
                                }}
                              />
                            </TableCell>
                          )}

                          <TableCell onClick={() => onSelectTask(task.id)}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: 'primary.main',
                              }}
                            >
                              {task.key}
                            </Typography>
                          </TableCell>

                          <TableCell onClick={() => onSelectTask(task.id)}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                              }}
                            >
                              {task.isMilestone && (
                                <Tooltip title={t('milestoneBadge')}>
                                  <DiamondIcon
                                    fontSize="small"
                                    sx={{ color: 'warning.main', fontSize: 16 }}
                                  />
                                </Tooltip>
                              )}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  textDecoration:
                                    task.status?.category === StatusCategory.DONE
                                      ? 'line-through'
                                      : 'none',
                                  color:
                                    task.status?.category === StatusCategory.DONE
                                      ? 'text.secondary'
                                      : 'text.primary',
                                }}
                              >
                                {task.title}
                              </Typography>
                              {Boolean(task.subtaskCount && task.subtaskCount > 0) && (
                                <Chip
                                  icon={<AccountTreeIcon sx={{ fontSize: 13 }} />}
                                  label={task.subtaskCount}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {canWrite ? (
                              <Select
                                size="small"
                                value={task.statusId}
                                onChange={(e) =>
                                  onInlineUpdateTask(task.id, {
                                    statusId: String(e.target.value),
                                  })
                                }
                                sx={{ fontSize: '0.8rem', minWidth: 135, height: 30 }}
                                data-testid={`task-status-select-${task.key}`}
                              >
                                {statuses.map((st) => (
                                  <MenuItem key={st.id} value={st.id}>
                                    {st.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            ) : (
                              <Chip label={task.status?.name || '—'} size="small" />
                            )}
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {canWrite ? (
                              <Select
                                size="small"
                                value={task.priority}
                                onChange={(e) =>
                                  onInlineUpdateTask(task.id, {
                                    priority: e.target.value as TaskPriority,
                                  })
                                }
                                sx={{ fontSize: '0.8rem', minWidth: 125, height: 30 }}
                                data-testid={`task-priority-select-${task.key}`}
                              >
                                <MenuItem value={TaskPriority.URGENT}>
                                  {t('priorityUrgent')}
                                </MenuItem>
                                <MenuItem value={TaskPriority.HIGH}>
                                  {t('priorityHigh')}
                                </MenuItem>
                                <MenuItem value={TaskPriority.MEDIUM}>
                                  {t('priorityMedium')}
                                </MenuItem>
                                <MenuItem value={TaskPriority.LOW}>
                                  {t('priorityLow')}
                                </MenuItem>
                                <MenuItem value={TaskPriority.NONE}>
                                  {t('priorityNone')}
                                </MenuItem>
                              </Select>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FlagIcon
                                  sx={{
                                    fontSize: 16,
                                    color: getPriorityColor(task.priority),
                                  }}
                                />
                                <Typography variant="caption">
                                  {getPriorityLabel(task.priority)}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>

                          <TableCell onClick={() => onSelectTask(task.id)}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {task.labels.map((lbl) => (
                                <Chip
                                  key={lbl.id}
                                  label={lbl.name}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    bgcolor: lbl.color,
                                    color: '#fff',
                                  }}
                                />
                              ))}
                            </Box>
                          </TableCell>

                          <TableCell onClick={() => onSelectTask(task.id)}>
                            {task.assigneeIds.length > 0 ? (
                              <AvatarGroup
                                max={3}
                                sx={{
                                  justifyContent: 'flex-end',
                                  '& .MuiAvatar-root': {
                                    width: 24,
                                    height: 24,
                                    fontSize: '0.7rem',
                                  },
                                }}
                              >
                                {task.assigneeIds.map((uid) => {
                                  const u = memberMap.get(uid);
                                  const name = u?.name || uid;
                                  return (
                                    <Tooltip key={uid} title={name}>
                                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                                        {name.charAt(0).toUpperCase()}
                                      </Avatar>
                                    </Tooltip>
                                  );
                                })}
                              </AvatarGroup>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell onClick={() => onSelectTask(task.id)}>
                            {task.dueDate ? (
                              <Chip
                                label={formatShortDate(task.dueDate)}
                                size="small"
                                color={taskOverdue ? 'error' : 'default'}
                                variant={taskOverdue ? 'filled' : 'outlined'}
                                sx={{ height: 22, fontSize: '0.72rem' }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell onClick={() => onSelectTask(task.id)}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.25,
                                color: 'text.secondary',
                              }}
                            >
                              {clTotal > 0 && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.35,
                                    color:
                                      clDone === clTotal
                                        ? 'success.main'
                                        : 'text.secondary',
                                  }}
                                  data-testid={`task-checklist-indicator-${task.key}`}
                                >
                                  <CheckBoxOutlinedIcon sx={{ fontSize: 15 }} />
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {clDone}/{clTotal}
                                  </Typography>
                                </Box>
                              )}

                              {Boolean(task.commentCount && task.commentCount > 0) && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.35,
                                  }}
                                  data-testid={`task-comment-indicator-${task.key}`}
                                >
                                  <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />
                                  <Typography variant="caption">
                                    {task.commentCount}
                                  </Typography>
                                </Box>
                              )}

                              {Boolean(
                                task.attachmentCount && task.attachmentCount > 0,
                              ) && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.25,
                                  }}
                                >
                                  <AttachFileIcon sx={{ fontSize: 14 }} />
                                  <Typography variant="caption">
                                    {task.attachmentCount}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          );
        })
      )}
    </Box>
  );
}
