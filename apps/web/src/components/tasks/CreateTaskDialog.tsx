'use client';

import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { useTranslations } from 'next-intl';
import {
  LabelDto,
  TaskDto,
  TaskPriority,
  WorkflowStatusDto,
  WorkspaceMemberDto,
} from '@fluxo/shared';
import { tasksApi } from '@/lib/api-client';

interface CreateTaskDialogProps {
  open: boolean;
  projectId: string;
  statuses: WorkflowStatusDto[];
  labels: LabelDto[];
  members: WorkspaceMemberDto[];
  onClose: () => void;
  onCreated: (task: TaskDto) => void;
}

export function CreateTaskDialog({
  open,
  projectId,
  statuses,
  labels,
  members,
  onClose,
  onCreated,
}: CreateTaskDialogProps) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');

  const [title, setTitle] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [statusId, setStatusId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [estimateMinutes, setEstimateMinutes] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescriptionText('');
      setStatusId(statuses[0]?.id || '');
      setPriority(TaskPriority.MEDIUM);
      setAssigneeId('');
      setSelectedLabelIds([]);
      setDueDate('');
      setEstimateMinutes('');
      setIsMilestone(false);
      setError(null);
    }
  }, [open, statuses]);

  const toggleLabel = (id: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const created = await tasksApi.create(projectId, {
        title: title.trim(),
        description: descriptionText.trim()
          ? { type: 'doc', text: descriptionText.trim() }
          : null,
        statusId: statusId || undefined,
        priority,
        assigneeIds: assigneeId ? [assigneeId] : [],
        labelIds: selectedLabelIds,
        dueDate: dueDate ? new Date(`${dueDate}T18:00:00.000Z`).toISOString() : null,
        estimateMinutes: estimateMinutes ? Number(estimateMinutes) : null,
        isMilestone,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('status.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('newTask')}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label={t('fieldTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              autoFocus
              inputProps={{ 'data-testid': 'create-task-title-input' }}
            />

            <TextField
              label={t('fieldDescription')}
              placeholder={t('descriptionPlaceholder')}
              value={descriptionText}
              onChange={(e) => setDescriptionText(e.target.value)}
              multiline
              rows={3}
              fullWidth
              inputProps={{ 'data-testid': 'create-task-description-input' }}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label={t('fieldStatus')}
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                sx={{ flex: 1, minWidth: 160 }}
              >
                {statuses.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label={t('fieldPriority')}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                sx={{ flex: 1, minWidth: 160 }}
                inputProps={{ 'data-testid': 'create-task-priority-select' }}
              >
                <MenuItem value={TaskPriority.NONE}>{t('priorityNone')}</MenuItem>
                <MenuItem value={TaskPriority.LOW}>{t('priorityLow')}</MenuItem>
                <MenuItem value={TaskPriority.MEDIUM}>{t('priorityMedium')}</MenuItem>
                <MenuItem value={TaskPriority.HIGH}>{t('priorityHigh')}</MenuItem>
                <MenuItem value={TaskPriority.URGENT}>{t('priorityUrgent')}</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label={t('fieldAssignees')}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                sx={{ flex: 1, minWidth: 160 }}
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
                label={t('fieldDueDate')}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 150 }}
              />

              <TextField
                type="number"
                label={t('fieldEstimate')}
                value={estimateMinutes}
                onChange={(e) => setEstimateMinutes(e.target.value)}
                sx={{ width: 140 }}
              />
            </Box>

            {labels.length > 0 && (
              <Box>
                <Box sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                  {t('sectionLabels')}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {labels.map((label) => {
                    const selected = selectedLabelIds.includes(label.id);
                    return (
                      <Chip
                        key={label.id}
                        label={label.name}
                        size="small"
                        onClick={() => toggleLabel(label.id)}
                        sx={{
                          bgcolor: selected ? label.color : 'transparent',
                          color: selected ? '#fff' : 'text.primary',
                          border: '1px solid',
                          borderColor: label.color,
                          fontWeight: 600,
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={isMilestone}
                  onChange={(e) => setIsMilestone(e.target.checked)}
                />
              }
              label={t('fieldMilestone')}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            {tCommon('actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !title.trim()}
            data-testid="create-task-submit-button"
          >
            {tCommon('actions.create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
