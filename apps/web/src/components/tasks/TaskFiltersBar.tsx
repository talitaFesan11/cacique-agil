'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslations } from 'next-intl';
import {
  LabelDto,
  SavedViewConfigDto,
  SavedViewDto,
  TaskPriority,
  WorkflowStatusDto,
  WorkspaceMemberDto,
} from '@fluxo/shared';

export interface ActiveTaskFilters {
  search: string;
  statusId: string;
  priority: string;
  labelId: string;
  assigneeId: string;
  groupBy: 'status' | 'priority' | 'none';
}

interface TaskFiltersBarProps {
  filters: ActiveTaskFilters;
  onChangeFilters: (next: ActiveTaskFilters) => void;
  statuses: WorkflowStatusDto[];
  labels: LabelDto[];
  members: WorkspaceMemberDto[];
  savedViews: SavedViewDto[];
  activeSavedViewId: string | null;
  onSelectSavedView: (view: SavedViewDto) => void;
  onCreateSavedView: (name: string, shared: boolean, config: SavedViewConfigDto) => Promise<void>;
  onDeleteSavedView: (viewId: string) => Promise<void>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  canWrite: boolean;
}

export function TaskFiltersBar({
  filters,
  onChangeFilters,
  statuses,
  labels,
  members,
  savedViews,
  activeSavedViewId,
  onSelectSavedView,
  onCreateSavedView,
  onDeleteSavedView,
  searchInputRef,
  canWrite,
}: TaskFiltersBarProps) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewShared, setViewShared] = useState(true);
  const [savingView, setSavingView] = useState(false);

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.statusId) ||
    Boolean(filters.priority) ||
    Boolean(filters.labelId) ||
    Boolean(filters.assigneeId);

  const handleReset = () => {
    onChangeFilters({
      search: '',
      statusId: '',
      priority: '',
      labelId: '',
      assigneeId: '',
      groupBy: 'status',
    });
  };

  const handleSaveView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewName.trim()) return;
    setSavingView(true);
    try {
      await onCreateSavedView(viewName.trim(), viewShared, {
        search: filters.search || undefined,
        statusId: filters.statusId || undefined,
        priority: (filters.priority as TaskPriority) || undefined,
        labelId: filters.labelId || undefined,
        assigneeId: filters.assigneeId || undefined,
        groupBy: filters.groupBy,
      });
      setViewName('');
      setSaveDialogOpen(false);
    } finally {
      setSavingView(false);
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        mb: 2.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Linha 1: Busca + Filtros Principais + Agrupamento */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={t('searchPlaceholder')}
          value={filters.search}
          onChange={(e) => onChangeFilters({ ...filters, search: e.target.value })}
          inputRef={searchInputRef}
          sx={{ flex: 1, minWidth: 220 }}
          inputProps={{ 'data-testid': 'task-search-input' }}
        />

        <TextField
          select
          size="small"
          label={t('filterStatus')}
          value={filters.statusId}
          onChange={(e) => onChangeFilters({ ...filters, statusId: e.target.value })}
          sx={{ minWidth: 145 }}
          inputProps={{ 'data-testid': 'task-filter-status' }}
        >
          <MenuItem value="">{t('allFilter')}</MenuItem>
          {statuses.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label={t('filterPriority')}
          value={filters.priority}
          onChange={(e) => onChangeFilters({ ...filters, priority: e.target.value })}
          sx={{ minWidth: 145 }}
          inputProps={{ 'data-testid': 'task-filter-priority' }}
        >
          <MenuItem value="">{t('allFilter')}</MenuItem>
          <MenuItem value={TaskPriority.URGENT}>{t('priorityUrgent')}</MenuItem>
          <MenuItem value={TaskPriority.HIGH}>{t('priorityHigh')}</MenuItem>
          <MenuItem value={TaskPriority.MEDIUM}>{t('priorityMedium')}</MenuItem>
          <MenuItem value={TaskPriority.LOW}>{t('priorityLow')}</MenuItem>
          <MenuItem value={TaskPriority.NONE}>{t('priorityNone')}</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label={t('filterLabel')}
          value={filters.labelId}
          onChange={(e) => onChangeFilters({ ...filters, labelId: e.target.value })}
          sx={{ minWidth: 145 }}
          inputProps={{ 'data-testid': 'task-filter-label' }}
        >
          <MenuItem value="">{t('allFilter')}</MenuItem>
          {labels.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label={t('filterAssignee')}
          value={filters.assigneeId}
          onChange={(e) => onChangeFilters({ ...filters, assigneeId: e.target.value })}
          sx={{ minWidth: 155 }}
        >
          <MenuItem value="">{t('allFilter')}</MenuItem>
          {members.map((m) => (
            <MenuItem key={m.user.id} value={m.user.id}>
              {m.user.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label={t('groupByLabel')}
          value={filters.groupBy}
          onChange={(e) =>
            onChangeFilters({
              ...filters,
              groupBy: e.target.value as 'status' | 'priority' | 'none',
            })
          }
          sx={{ minWidth: 155 }}
          inputProps={{ 'data-testid': 'task-groupby-select' }}
        >
          <MenuItem value="status">{t('groupByStatus')}</MenuItem>
          <MenuItem value="priority">{t('groupByPriority')}</MenuItem>
          <MenuItem value="none">{t('groupByNone')}</MenuItem>
        </TextField>

        {hasActiveFilters && (
          <Button
            size="small"
            color="inherit"
            startIcon={<ClearAllIcon />}
            onClick={handleReset}
            data-testid="clear-task-filters-button"
          >
            {t('clearFilters')}
          </Button>
        )}
      </Box>

      {/* Linha 2: Visões Salvas (SavedViews) */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pt: 1,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'text.secondary',
              mr: 1,
            }}
          >
            <BookmarkAddedIcon fontSize="small" />
            {t('savedViews')}:
          </Box>

          {savedViews.length === 0 ? (
            <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              {t('noSavedViews')}
            </Box>
          ) : (
            savedViews.map((view) => {
              const isSelected = activeSavedViewId === view.id;
              return (
                <Chip
                  key={view.id}
                  label={view.name}
                  size="small"
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => onSelectSavedView(view)}
                  onDelete={
                    canWrite ? () => onDeleteSavedView(view.id) : undefined
                  }
                  deleteIcon={<DeleteOutlineIcon fontSize="small" />}
                  data-testid={`saved-view-chip-${view.name}`}
                />
              );
            })
          )}
        </Box>

        {canWrite && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<BookmarkBorderIcon fontSize="small" />}
            onClick={() => setSaveDialogOpen(true)}
            data-testid="open-save-view-dialog-button"
          >
            {t('saveCurrentView')}
          </Button>
        )}
      </Box>

      {/* Modal para salvar visão */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={handleSaveView}>
          <DialogTitle sx={{ fontWeight: 700 }}>{t('saveCurrentView')}</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label={t('savedViewNameLabel')}
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                required
                fullWidth
                autoFocus
                inputProps={{ 'data-testid': 'saved-view-name-input' }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={viewShared}
                    onChange={(e) => setViewShared(e.target.checked)}
                  />
                }
                label={t('savedViewSharedLabel')}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)} color="inherit">
              {tCommon('actions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingView || !viewName.trim()}
              data-testid="confirm-save-view-button"
            >
              {tCommon('actions.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
