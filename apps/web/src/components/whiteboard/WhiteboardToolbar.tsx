'use client';

import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import NearMeIcon from '@mui/icons-material/NearMe';
import PanToolIcon from '@mui/icons-material/PanTool';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import CropLandscapeIcon from '@mui/icons-material/CropLandscape';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import CreateIcon from '@mui/icons-material/Create';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import AddTaskIcon from '@mui/icons-material/AddTask';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import styles from './whiteboard.module.css';

export type ToolMode =
  | 'select'
  | 'pan'
  | 'sticky'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'arrow'
  | 'draw'
  | 'frame';

interface WhiteboardToolbarProps {
  currentMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  onOpenTaskDrawer: () => void;
  onOpenTemplates: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  zoomLevel: number;
  selectedStickyCount: number;
  onConvertSelection: () => void;
  readOnly?: boolean;
}

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  currentMode,
  onSelectMode,
  onOpenTaskDrawer,
  onOpenTemplates,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  zoomLevel,
  selectedStickyCount,
  onConvertSelection,
  readOnly = false,
}) => {
  return (
    <div className={styles.floatingToolbar}>
      {/* Botão contextual para converter seleção múltipla */}
      {selectedStickyCount > 1 && (
        <>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<PlaylistAddCheckIcon />}
            onClick={onConvertSelection}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 2 }}
            data-testid="convert-selection-btn"
          >
            Converter {selectedStickyCount} notas em tarefas
          </Button>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        </>
      )}

      {/* Ferramentas de Seleção e Navegação */}
      <Tooltip title="Selecionar (V)">
        <IconButton
          size="small"
          onClick={() => onSelectMode('select')}
          color={currentMode === 'select' ? 'primary' : 'default'}
          sx={{ bgcolor: currentMode === 'select' ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}
          data-testid="tool-select"
        >
          <NearMeIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Mover Tela / Pan (H ou Espaço)">
        <IconButton
          size="small"
          onClick={() => onSelectMode('pan')}
          color={currentMode === 'pan' ? 'primary' : 'default'}
          sx={{ bgcolor: currentMode === 'pan' ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}
          data-testid="tool-pan"
        >
          <PanToolIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {!readOnly && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Criação de Elementos */}
          <Tooltip title="Nota Adesiva (Post-it)">
            <IconButton
              size="small"
              onClick={() => onSelectMode('sticky')}
              color={currentMode === 'sticky' ? 'primary' : 'default'}
              sx={{ bgcolor: currentMode === 'sticky' ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}
              data-testid="tool-sticky"
            >
              <NoteAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Retângulo">
            <IconButton
              size="small"
              onClick={() => onSelectMode('rectangle')}
              color={currentMode === 'rectangle' ? 'primary' : 'default'}
              sx={{ bgcolor: currentMode === 'rectangle' ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}
              data-testid="tool-rectangle"
            >
              <CropLandscapeIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Elipse / Círculo">
            <IconButton
              size="small"
              onClick={() => onSelectMode('ellipse')}
              color={currentMode === 'ellipse' ? 'primary' : 'default'}
              sx={{ bgcolor: currentMode === 'ellipse' ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}
              data-testid="tool-ellipse"
            >
              <RadioButtonUncheckedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Losango (Decisão)">
            <IconButton
              size="small"
              onClick={() => onSelectMode('diamond')}
              color={currentMode === 'diamond' ? 'primary' : 'default'}
              sx={{ bgcolor: currentMode === 'diamond' ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}
              data-testid="tool-diamond"
            >
              <ChangeHistoryIcon sx={{ transform: 'rotate(45deg)' }} fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Seta Conectora">
            <IconButton
              size="small"
              onClick={() => onSelectMode('arrow')}
              color={currentMode === 'arrow' ? 'primary' : 'default'}
              sx={{ bgcolor: currentMode === 'arrow' ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}
              data-testid="tool-arrow"
            >
              <ArrowRightAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Caneta / Desenho Livre">
            <IconButton
              size="small"
              onClick={() => onSelectMode('draw')}
              color={currentMode === 'draw' ? 'primary' : 'default'}
              sx={{ bgcolor: currentMode === 'draw' ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}
              data-testid="tool-draw"
            >
              <CreateIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Moldura / Frame">
            <IconButton
              size="small"
              onClick={() => onSelectMode('frame')}
              color={currentMode === 'frame' ? 'primary' : 'default'}
              sx={{ bgcolor: currentMode === 'frame' ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}
              data-testid="tool-frame"
            >
              <WebAssetIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Integrações com Tarefas e Templates */}
          <Tooltip title="Inserir Tarefas do Projeto">
            <IconButton
              size="small"
              onClick={onOpenTaskDrawer}
              color="primary"
              data-testid="tool-tasks-drawer"
            >
              <AddTaskIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Modelos Prontos (Brainstorming, Mindmap...)">
            <IconButton
              size="small"
              onClick={onOpenTemplates}
              color="primary"
              data-testid="tool-templates"
            >
              <AutoFixHighIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Controles de Zoom */}
      <Tooltip title="Diminuir Zoom">
        <IconButton size="small" onClick={onZoomOut} data-testid="zoom-out">
          <ZoomOutIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#64748b',
          minWidth: 42,
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        {Math.round(zoomLevel * 100)}%
      </span>

      <Tooltip title="Aumentar Zoom">
        <IconButton size="small" onClick={onZoomIn} data-testid="zoom-in">
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Resetar Zoom (100%)">
        <IconButton size="small" onClick={onResetZoom} data-testid="zoom-reset">
          <RestartAltIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
};
