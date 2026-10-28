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
import Alert from '@mui/material/Alert';
import { useTranslations } from 'next-intl';
import { ProjectDto, ProjectStatus } from '@fluxo/shared';
import { projectsApi } from '@/lib/api-client';

interface CreateProjectDialogProps {
  open: boolean;
  workspaceId: string;
  projectToEdit?: ProjectDto | null;
  onClose: () => void;
  onSaved: (project: ProjectDto) => void;
}

const COLOR_SWATCHES = [
  '#2563EB',
  '#9333EA',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#06B6D4',
];

export function CreateProjectDialog({
  open,
  workspaceId,
  projectToEdit,
  onClose,
  onSaved,
}: CreateProjectDialogProps) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');

  const isEdit = Boolean(projectToEdit);

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [color, setColor] = useState('#2563EB');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setKey(projectToEdit.key);
      setKeyTouched(true);
      setDescription(projectToEdit.description || '');
      setStatus(projectToEdit.status);
      setColor(projectToEdit.color || '#2563EB');
      setDueDate(
        projectToEdit.dueDate
          ? String(projectToEdit.dueDate).slice(0, 10)
          : '',
      );
    } else {
      setName('');
      setKey('');
      setKeyTouched(false);
      setDescription('');
      setStatus(ProjectStatus.ACTIVE);
      setColor('#2563EB');
      setDueDate('');
    }
    setError(null);
  }, [projectToEdit, open]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEdit && !keyTouched) {
      const cleaned = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      if (cleaned.length >= 2) {
        setKey(cleaned.slice(0, 5));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let saved: ProjectDto;
      if (isEdit && projectToEdit) {
        saved = await projectsApi.update(projectToEdit.id, {
          name: name.trim(),
          description: description.trim() || null,
          status,
          color,
          dueDate: dueDate ? new Date(`${dueDate}T18:00:00.000Z`).toISOString() : null,
        });
      } else {
        saved = await projectsApi.create({
          workspaceId,
          name: name.trim(),
          key: key.trim().toUpperCase(),
          description: description.trim() || null,
          status,
          color,
          dueDate: dueDate ? new Date(`${dueDate}T18:00:00.000Z`).toISOString() : null,
        });
      }
      onSaved(saved);
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
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEdit ? t('editProject') : t('newProject')}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label={t('nameLabel')}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              fullWidth
              inputProps={{ 'data-testid': 'project-name-input' }}
            />

            <TextField
              label={t('keyLabel')}
              value={key}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toUpperCase());
              }}
              helperText={t('keyHelper')}
              disabled={isEdit}
              required
              fullWidth
              inputProps={{ maxLength: 10, 'data-testid': 'project-key-input' }}
            />

            <TextField
              label={t('descriptionLabel')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              inputProps={{ 'data-testid': 'project-description-input' }}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label={t('statusLabel')}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                sx={{ flex: 1, minWidth: 180 }}
                inputProps={{ 'data-testid': 'project-status-select' }}
              >
                <MenuItem value={ProjectStatus.PLANNING}>{t('statusPlanning')}</MenuItem>
                <MenuItem value={ProjectStatus.ACTIVE}>{t('statusActive')}</MenuItem>
                <MenuItem value={ProjectStatus.ON_HOLD}>{t('statusOnHold')}</MenuItem>
                <MenuItem value={ProjectStatus.COMPLETED}>{t('statusCompleted')}</MenuItem>
                <MenuItem value={ProjectStatus.ARCHIVED}>{t('statusArchived')}</MenuItem>
              </TextField>

              <TextField
                type="date"
                label={t('dueDateLabel')}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 180 }}
              />
            </Box>

            <Box>
              <Box sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1 }}>
                {t('colorLabel')}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {COLOR_SWATCHES.map((swatch) => (
                  <Box
                    key={swatch}
                    onClick={() => setColor(swatch)}
                    role="button"
                    tabIndex={0}
                    aria-label={swatch}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: swatch,
                      cursor: 'pointer',
                      border: color === swatch ? '3px solid' : '2px solid transparent',
                      borderColor: color === swatch ? 'text.primary' : 'transparent',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            {tCommon('actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !name.trim() || !key.trim()}
            data-testid="project-submit-button"
          >
            {loading ? t('saving') : tCommon('actions.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
