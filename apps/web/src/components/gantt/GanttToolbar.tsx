'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import SyncIcon from '@mui/icons-material/Sync';
import AddLinkIcon from '@mui/icons-material/AddLink';
import TimelineIcon from '@mui/icons-material/Timeline';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useTranslations } from 'next-intl';
import { GanttZoomLevel, ProjectBaselineDto } from '@fluxo/shared';

interface GanttToolbarProps {
  zoom: GanttZoomLevel;
  onChangeZoom: (zoom: GanttZoomLevel) => void;
  highlightCritical: boolean;
  onToggleCritical: (highlight: boolean) => void;
  baselines: ProjectBaselineDto[];
  selectedBaselineId: string | null;
  onSelectBaseline: (baselineId: string | null) => void;
  onOpenSaveBaseline: () => void;
  onOpenAddDependency: () => void;
  onAutoReschedule: () => void;
  onExportPng: () => void;
  isExporting?: boolean;
  canWrite: boolean;
  tableCollapsed?: boolean;
  onToggleTable?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function GanttToolbar({
  zoom,
  onChangeZoom,
  highlightCritical,
  onToggleCritical,
  baselines,
  selectedBaselineId,
  onSelectBaseline,
  onOpenSaveBaseline,
  onOpenAddDependency,
  onAutoReschedule,
  onExportPng,
  isExporting,
  canWrite,
  tableCollapsed,
  onToggleTable,
  isFullscreen,
  onToggleFullscreen,
}: GanttToolbarProps) {
  const t = useTranslations('gantt');

  return (
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
        flexShrink: 0,
      }}
    >
      {/* Banner Superior no Modo Tela Cheia */}
      {isFullscreen && (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            mb: 0.5,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {t('title')} — Modo Tela Cheia
            </Typography>
            <Chip
              size="small"
              label="Pressione ESC para sair"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.6875rem' }}
            />
          </Box>
        </Box>
      )}
      {/* Zoom e Filtros */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {/* Botão de Ocultar/Exibir Tabela */}
        {onToggleTable && (
          <Tooltip title={tableCollapsed ? t('showTable') : t('hideTable')}>
            <Button
              variant={tableCollapsed ? 'contained' : 'outlined'}
              size="small"
              startIcon={tableCollapsed ? <ViewSidebarIcon /> : <ViewSidebarOutlinedIcon />}
              onClick={onToggleTable}
              data-testid="toggle-table-button"
              sx={{ textTransform: 'none' }}
            >
              {tableCollapsed ? t('showTable') : t('hideTable')}
            </Button>
          </Tooltip>
        )}

        {/* Botão de Tela Cheia / Expandir */}
        {onToggleFullscreen && (
          <Tooltip title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}>
            <Button
              variant={isFullscreen ? 'contained' : 'outlined'}
              size="small"
              color={isFullscreen ? 'primary' : 'inherit'}
              startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              onClick={onToggleFullscreen}
              data-testid="toggle-fullscreen-button"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {isFullscreen ? t('exitFullscreen') : t('fullscreen')}
            </Button>
          </Tooltip>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {t('zoomLevel')}
          </Typography>
          <ToggleButtonGroup
            size="small"
            value={zoom}
            exclusive
            onChange={(_, val) => val && onChangeZoom(val)}
            data-testid="gantt-zoom-group"
          >
            <ToggleButton value={GanttZoomLevel.DAY} data-testid="zoom-day">
              {t('zoomDay')}
            </ToggleButton>
            <ToggleButton value={GanttZoomLevel.WEEK} data-testid="zoom-week">
              {t('zoomWeek')}
            </ToggleButton>
            <ToggleButton value={GanttZoomLevel.MONTH} data-testid="zoom-month">
              {t('zoomMonth')}
            </ToggleButton>
            <ToggleButton value={GanttZoomLevel.QUARTER} data-testid="zoom-quarter">
              {t('zoomQuarter')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={highlightCritical}
              onChange={(e) => onToggleCritical(e.target.checked)}
              color="error"
              data-testid="toggle-critical-path"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimelineIcon fontSize="small" color={highlightCritical ? 'error' : 'action'} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t('highlightCritical')}
              </Typography>
            </Box>
          }
        />
      </Box>

      {/* Linha de Base, Reagendamento e Ações */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {/* Seletor de Baseline */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {t('baseline')}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={selectedBaselineId || ''}
              onChange={(e) => onSelectBaseline(e.target.value || null)}
              displayEmpty
              data-testid="select-baseline"
              inputProps={{ 'data-testid': 'select-baseline-input' }}
            >
              <MenuItem value="">{t('noBaseline')}</MenuItem>
              {baselines.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {canWrite && (
          <>
            <Tooltip title={t('saveBaselineTitle')}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<BookmarkAddIcon />}
                onClick={onOpenSaveBaseline}
                data-testid="open-save-baseline-button"
              >
                {t('saveBaseline')}
              </Button>
            </Tooltip>

            <Tooltip title={t('addDependencyTitle')}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddLinkIcon />}
                onClick={onOpenAddDependency}
                data-testid="open-add-dependency-button"
              >
                {t('addDependencyTitle')}
              </Button>
            </Tooltip>

            <Tooltip title={t('autoReschedule')}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SyncIcon />}
                onClick={onAutoReschedule}
                data-testid="auto-reschedule-button"
              >
                {t('autoReschedule')}
              </Button>
            </Tooltip>
          </>
        )}

        <Button
          variant="contained"
          size="small"
          startIcon={<CameraAltIcon />}
          onClick={onExportPng}
          disabled={isExporting}
          data-testid="export-png-button"
        >
          {t('exportPng')}
        </Button>
      </Box>
    </Box>
  );
}
