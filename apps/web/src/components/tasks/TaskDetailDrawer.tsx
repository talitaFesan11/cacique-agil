'use client';

import React, { useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import LinearProgress from '@mui/material/LinearProgress';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SendIcon from '@mui/icons-material/Send';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LabelDto,
  TaskPriority,
  WorkflowStatusDto,
  WorkspaceMemberDto,
} from '@fluxo/shared';
import { projectsApi, tasksApi } from '@/lib/api-client';

interface TaskDetailDrawerProps {
  taskId: string | null;
  workspaceId: string;
  projectId: string;
  statuses: WorkflowStatusDto[];
  labels: LabelDto[];
  members: WorkspaceMemberDto[];
  canWrite: boolean;
  onClose: () => void;
  onTaskChanged: () => void;
  onSelectSubtask: (subtaskId: string) => void;
}

function extractDescriptionText(desc: unknown): string {
  if (!desc) return '';
  if (typeof desc === 'string') return desc;
  if (typeof desc === 'object' && desc !== null) {
    const record = desc as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if (Array.isArray(record.content)) {
      return record.content
        .map((block: Record<string, unknown>) => {
          if (Array.isArray(block.content)) {
            return block.content
              .map((inline: Record<string, unknown>) =>
                typeof inline.text === 'string' ? inline.text : '',
              )
              .join('');
          }
          return '';
        })
        .join('\n');
    }
  }
  return '';
}

export function TaskDetailDrawer({
  taskId,
  workspaceId,
  projectId,
  statuses,
  labels,
  members,
  canWrite,
  onClose,
  onTaskChanged,
  onSelectSubtask,
}: TaskDetailDrawerProps) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const {
    data: task,
    isLoading,
    refetch: refetchTask,
  } = useQuery({
    queryKey: ['task-detail', taskId],
    queryFn: () => tasksApi.getById(taskId!),
    enabled: Boolean(taskId),
  });

  const [title, setTitle] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [checklistItemInputs, setChecklistItemInputs] = useState<Record<string, string>>(
    {},
  );
  const [attachmentFileName, setAttachmentFileName] = useState('');
  const [attachmentMimeType, setAttachmentMimeType] = useState('application/pdf');
  const [attachmentSize] = useState('128000');
  const [commentText, setCommentText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescriptionText(extractDescriptionText(task.description));
      setActionError(null);
    }
  }, [task]);

  const refreshAll = async () => {
    await refetchTask();
    onTaskChanged();
  };

  const handleFieldUpdate = async (patch: Record<string, unknown>) => {
    if (!task || !canWrite) return;
    setActionError(null);
    try {
      await tasksApi.update(task.id, patch);
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleTitleBlur = async () => {
    if (!task || !canWrite) return;
    if (title.trim() && title.trim() !== task.title) {
      await handleFieldUpdate({ title: title.trim() });
    }
  };

  const handleSaveDescription = async () => {
    if (!task || !canWrite) return;
    await handleFieldUpdate({
      description: {
        type: 'doc',
        text: descriptionText.trim(),
      },
    });
  };

  const handleToggleLabel = async (labelId: string) => {
    if (!task || !canWrite) return;
    setActionError(null);
    const hasLabel = task.labels.some((l) => l.id === labelId);
    try {
      if (hasLabel) {
        await tasksApi.detachLabel(task.id, labelId);
      } else {
        await tasksApi.attachLabel(task.id, labelId);
      }
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleCreateAndAttachLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !canWrite || !newLabelName.trim()) return;
    setActionError(null);
    try {
      const createdLabel = await projectsApi.createWorkspaceLabel(workspaceId, {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      await tasksApi.attachLabel(task.id, createdLabel.id);
      setNewLabelName('');
      await queryClient.invalidateQueries({ queryKey: ['workspace-labels', workspaceId] });
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !canWrite || !newSubtaskTitle.trim()) return;
    setActionError(null);
    try {
      await tasksApi.create(projectId, {
        title: newSubtaskTitle.trim(),
        parentId: task.id,
        statusId: statuses[0]?.id,
        priority: TaskPriority.MEDIUM,
        assigneeIds: [],
      });
      setNewSubtaskTitle('');
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !canWrite || !newChecklistTitle.trim()) return;
    setActionError(null);
    try {
      await tasksApi.createChecklist(task.id, { title: newChecklistTitle.trim() });
      setNewChecklistTitle('');
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    const text = (checklistItemInputs[checklistId] || '').trim();
    if (!text || !canWrite) return;
    setActionError(null);
    try {
      await tasksApi.addChecklistItem(checklistId, { text });
      setChecklistItemInputs((prev) => ({ ...prev, [checklistId]: '' }));
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleToggleChecklistItem = async (itemId: string, done: boolean) => {
    if (!canWrite) return;
    setActionError(null);
    try {
      await tasksApi.updateChecklistItem(itemId, { done });
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!canWrite) return;
    try {
      await tasksApi.deleteChecklistItem(itemId);
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !canWrite || !attachmentFileName.trim()) return;
    setActionError(null);
    try {
      await tasksApi.createAttachment(task.id, {
        fileName: attachmentFileName.trim(),
        mimeType: attachmentMimeType,
        size: Math.max(1, Number(attachmentSize) || 1024),
      });
      setAttachmentFileName('');
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!canWrite) return;
    try {
      await tasksApi.deleteAttachment(attachmentId);
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !commentText.trim()) return;
    setActionError(null);
    try {
      await tasksApi.createComment(task.id, {
        text: commentText.trim(),
      });
      setCommentText('');
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  const handleInsertMention = (memberName: string) => {
    const slugTag = memberName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(' ')[0];
    setCommentText((prev) => `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}@${slugTag} `);
  };

  const handleDeleteTask = async () => {
    if (!task || !canWrite) return;
    try {
      await tasksApi.remove(task.id);
      onClose();
      onTaskChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : tCommon('status.error'));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={Boolean(taskId)}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540, md: 640 },
          p: 0,
          display: 'flex',
          flexDirection: 'column',
        },
        'data-testid': 'task-detail-drawer',
      }}
    >
      {/* Cabeçalho Fixo do Drawer */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {task && (
            <Chip
              label={task.key}
              color="primary"
              size="small"
              sx={{ fontFamily: 'monospace', fontWeight: 700 }}
            />
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('drawerTitle')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {canWrite && task && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteOutlineIcon fontSize="small" />}
              onClick={handleDeleteTask}
              data-testid="drawer-delete-task-button"
            >
              {t('deleteTaskConfirm')}
            </Button>
          )}
          <IconButton
            onClick={onClose}
            aria-label={tCommon('actions.close')}
            data-testid="close-task-drawer-button"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Corpo Rolável do Drawer */}
      <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {actionError && <Alert severity="error">{actionError}</Alert>}

        {isLoading || !task ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={180} />
          </Box>
        ) : (
          <>
            {/* Título da Tarefa */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label={t('fieldTitle')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                disabled={!canWrite}
                fullWidth
                inputProps={{ 'data-testid': 'drawer-task-title-input' }}
              />
              {canWrite && title.trim() !== task.title && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleTitleBlur}
                  data-testid="drawer-save-title-button"
                >
                  {tCommon('actions.save')}
                </Button>
              )}
            </Box>

            {/* Metadados Principais */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                size="small"
                label={t('fieldStatus')}
                value={task.statusId}
                disabled={!canWrite}
                onChange={(e) => handleFieldUpdate({ statusId: e.target.value })}
                inputProps={{ 'data-testid': 'drawer-task-status-select' }}
              >
                {statuses.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    {st.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label={t('fieldPriority')}
                value={task.priority}
                disabled={!canWrite}
                onChange={(e) => handleFieldUpdate({ priority: e.target.value })}
                inputProps={{ 'data-testid': 'drawer-task-priority-select' }}
              >
                <MenuItem value={TaskPriority.URGENT}>{t('priorityUrgent')}</MenuItem>
                <MenuItem value={TaskPriority.HIGH}>{t('priorityHigh')}</MenuItem>
                <MenuItem value={TaskPriority.MEDIUM}>{t('priorityMedium')}</MenuItem>
                <MenuItem value={TaskPriority.LOW}>{t('priorityLow')}</MenuItem>
                <MenuItem value={TaskPriority.NONE}>{t('priorityNone')}</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label={t('fieldAssignees')}
                value={task.assigneeIds[0] || ''}
                disabled={!canWrite}
                onChange={(e) =>
                  handleFieldUpdate({
                    assigneeIds: e.target.value ? [e.target.value] : [],
                  })
                }
              >
                <MenuItem value="">—</MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="date"
                size="small"
                label={t('fieldDueDate')}
                value={task.dueDate ? String(task.dueDate).slice(0, 10) : ''}
                disabled={!canWrite}
                onChange={(e) =>
                  handleFieldUpdate({
                    dueDate: e.target.value
                      ? new Date(`${e.target.value}T18:00:00.000Z`).toISOString()
                      : null,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* Progresso e Marco */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {t('fieldProgress', { progress: task.progress })}
                </Typography>
                <Slider
                  size="small"
                  value={task.progress}
                  disabled={!canWrite}
                  step={5}
                  min={0}
                  max={100}
                  onChangeCommitted={(_e, val) =>
                    handleFieldUpdate({ progress: Number(val) })
                  }
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={task.isMilestone}
                    disabled={!canWrite}
                    onChange={(e) =>
                      handleFieldUpdate({ isMilestone: e.target.checked })
                    }
                  />
                }
                label={<Typography variant="body2">{t('fieldMilestone')}</Typography>}
              />
            </Box>

            {/* Descrição Rica */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {t('fieldDescription')}
              </Typography>
              <TextField
                multiline
                rows={3}
                fullWidth
                placeholder={t('descriptionPlaceholder')}
                value={descriptionText}
                disabled={!canWrite}
                onChange={(e) => setDescriptionText(e.target.value)}
                inputProps={{ 'data-testid': 'drawer-task-description-input' }}
              />
              {canWrite && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSaveDescription}
                    data-testid="drawer-save-description-button"
                  >
                    {t('saveDescription')}
                  </Button>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Seção: Etiquetas (Labels) */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LocalOfferOutlinedIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t('sectionLabels')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                {labels.map((label) => {
                  const active = task.labels.some((l) => l.id === label.id);
                  return (
                    <Chip
                      key={label.id}
                      label={label.name}
                      size="small"
                      onClick={canWrite ? () => handleToggleLabel(label.id) : undefined}
                      data-testid={`drawer-label-chip-${label.name}`}
                      sx={{
                        bgcolor: active ? label.color : 'transparent',
                        color: active ? '#fff' : 'text.primary',
                        border: '1px solid',
                        borderColor: label.color,
                        fontWeight: 600,
                      }}
                    />
                  );
                })}
              </Box>

              {canWrite && (
                <Box
                  component="form"
                  onSubmit={handleCreateAndAttachLabel}
                  sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                >
                  <TextField
                    size="small"
                    placeholder={t('newLabelName')}
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    sx={{ flex: 1 }}
                    inputProps={{ 'data-testid': 'drawer-new-label-input' }}
                  />
                  <input
                    type="color"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    aria-label={t('sectionLabels')}
                    style={{ width: 36, height: 34, border: 'none', cursor: 'pointer' }}
                  />
                  <Button
                    type="submit"
                    size="small"
                    variant="outlined"
                    disabled={!newLabelName.trim()}
                    data-testid="drawer-create-label-button"
                  >
                    {t('createLabelButton')}
                  </Button>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Seção: Subtarefas */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AccountTreeIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t('sectionSubtasks')}
                </Typography>
              </Box>

              {task.subtasks && task.subtasks.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                  {task.subtasks.map((st) => (
                    <Box
                      key={st.id}
                      onClick={() => onSelectSubtask(st.id)}
                      sx={{
                        p: 1,
                        px: 1.5,
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                        >
                          {st.key}
                        </Typography>
                        <Typography variant="body2">{st.title}</Typography>
                      </Box>
                      <Chip label={`${st.progress}%`} size="small" />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {t('noSubtasks')}
                </Typography>
              )}

              {canWrite && (
                <Box
                  component="form"
                  onSubmit={handleCreateSubtask}
                  sx={{ display: 'flex', gap: 1 }}
                >
                  <TextField
                    size="small"
                    placeholder={t('newSubtaskPlaceholder')}
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    fullWidth
                    inputProps={{ 'data-testid': 'drawer-new-subtask-input' }}
                  />
                  <Button
                    type="submit"
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    disabled={!newSubtaskTitle.trim()}
                    sx={{ whiteSpace: 'nowrap' }}
                    data-testid="drawer-add-subtask-button"
                  >
                    {t('addSubtaskButton')}
                  </Button>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Seção: Checklists */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CheckBoxOutlinedIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t('sectionChecklists')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                {(task.checklists || []).map((cl) => {
                  const total = cl.items.length;
                  const done = cl.items.filter((i) => i.done).length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <Box
                      key={cl.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        border: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.75,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {cl.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {done}/{total} ({pct}%)
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ height: 5, borderRadius: 2, mb: 1.5 }}
                      />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {cl.items.map((item) => (
                          <Box
                            key={item.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={item.done}
                                  disabled={!canWrite}
                                  onChange={(e) =>
                                    handleToggleChecklistItem(item.id, e.target.checked)
                                  }
                                  data-testid={`checklist-item-checkbox-${item.text}`}
                                />
                              }
                              label={
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textDecoration: item.done ? 'line-through' : 'none',
                                    color: item.done ? 'text.secondary' : 'text.primary',
                                  }}
                                >
                                  {item.text}
                                </Typography>
                              }
                            />

                            {canWrite && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteChecklistItem(item.id)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Box>

                      {canWrite && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <TextField
                            size="small"
                            placeholder={t('newChecklistItemPlaceholder')}
                            value={checklistItemInputs[cl.id] || ''}
                            onChange={(e) =>
                              setChecklistItemInputs((prev) => ({
                                ...prev,
                                [cl.id]: e.target.value,
                              }))
                            }
                            fullWidth
                            inputProps={{
                              'data-testid': `new-checklist-item-input-${cl.title}`,
                            }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAddChecklistItem(cl.id)}
                            data-testid={`add-checklist-item-button-${cl.title}`}
                            sx={{ whiteSpace: 'nowrap' }}
                          >
                            {t('addItemButton')}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>

              {canWrite && (
                <Box
                  component="form"
                  onSubmit={handleCreateChecklist}
                  sx={{ display: 'flex', gap: 1 }}
                >
                  <TextField
                    size="small"
                    placeholder={t('newChecklistPlaceholder')}
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    fullWidth
                    inputProps={{ 'data-testid': 'drawer-new-checklist-input' }}
                  />
                  <Button
                    type="submit"
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    disabled={!newChecklistTitle.trim()}
                    sx={{ whiteSpace: 'nowrap' }}
                    data-testid="drawer-add-checklist-button"
                  >
                    {t('addChecklistButton')}
                  </Button>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Seção: Anexos */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AttachFileIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t('sectionAttachments')}
                </Typography>
              </Box>

              {task.attachments && task.attachments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                  {task.attachments.map((att) => (
                    <Box
                      key={att.id}
                      sx={{
                        p: 1,
                        px: 1.5,
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {att.fileName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {att.mimeType} • {Math.round(att.size / 1024)} KB
                        </Typography>
                      </Box>
                      {canWrite && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {t('noAttachments')}
                </Typography>
              )}

              {canWrite && (
                <Box
                  component="form"
                  onSubmit={handleAddAttachment}
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
                >
                  <TextField
                    size="small"
                    placeholder={t('attachmentNameLabel')}
                    value={attachmentFileName}
                    onChange={(e) => setAttachmentFileName(e.target.value)}
                    sx={{ flex: 1, minWidth: 180 }}
                    inputProps={{ 'data-testid': 'drawer-attachment-name-input' }}
                  />
                  <TextField
                    select
                    size="small"
                    value={attachmentMimeType}
                    onChange={(e) => setAttachmentMimeType(e.target.value)}
                    sx={{ width: 150 }}
                  >
                    <MenuItem value="application/pdf">PDF</MenuItem>
                    <MenuItem value="image/png">PNG</MenuItem>
                    <MenuItem value="text/markdown">Markdown</MenuItem>
                    <MenuItem value="text/csv">CSV</MenuItem>
                  </TextField>
                  <Button
                    type="submit"
                    size="small"
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    disabled={!attachmentFileName.trim()}
                    data-testid="drawer-add-attachment-button"
                  >
                    {t('addAttachmentButton')}
                  </Button>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Seção: Comentários com Menções (@) */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <ChatBubbleOutlineIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t('sectionComments')}
                </Typography>
              </Box>

              {/* Lista de Comentários */}
              {task.comments && task.comments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                  {task.comments.map((c) => (
                    <Box
                      key={c.id}
                      data-testid="task-comment-item"
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: 'action.hover',
                        border: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.75,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: '0.7rem',
                              bgcolor: 'secondary.main',
                            }}
                          >
                            {(c.author?.name || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {c.author?.name || c.authorId}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(c.createdAt))}
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {c.body.text}
                      </Typography>

                      {c.body.mentions && c.body.mentions.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                          {c.body.mentions.map((mention) => (
                            <Chip
                              key={mention}
                              label={`@${mention}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {t('noComments')}
                </Typography>
              )}

              {/* Atalhos de Menção (@membro) */}
              {members.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                  {members.map((m) => (
                    <Chip
                      key={m.user.id}
                      icon={<AlternateEmailIcon sx={{ fontSize: 13 }} />}
                      label={m.user.name.split(' ')[0]}
                      size="small"
                      variant="outlined"
                      onClick={() => handleInsertMention(m.user.name)}
                    />
                  ))}
                </Box>
              )}

              {/* Formulário de Novo Comentário */}
              <Box
                component="form"
                onSubmit={handleAddComment}
                sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
              >
                <TextField
                  multiline
                  rows={2}
                  size="small"
                  placeholder={t('commentPlaceholder')}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  fullWidth
                  inputProps={{ 'data-testid': 'drawer-comment-input' }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    endIcon={<SendIcon fontSize="small" />}
                    disabled={!commentText.trim()}
                    data-testid="drawer-send-comment-button"
                  >
                    {t('sendCommentButton')}
                  </Button>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
