'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { CanvasElement, CanvasStickyColor } from '@fluxo/shared';
import styles from './whiteboard.module.css';

interface WhiteboardStickyNoteProps {
  element: CanvasElement;
  isSelected: boolean;
  onUpdate: (updated: Partial<CanvasElement>) => void;
  onConvertToTask: (element: CanvasElement) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

const STICKY_COLORS: Record<CanvasStickyColor, { bg: string; text: string }> = {
  yellow: { bg: '#fef08a', text: '#854d0e' },
  blue: { bg: '#bfdbfe', text: '#1e3a8a' },
  green: { bg: '#bbf7d0', text: '#14532d' },
  pink: { bg: '#fbcfe8', text: '#831843' },
  purple: { bg: '#e9d5ff', text: '#581c87' },
  orange: { bg: '#fed7aa', text: '#7c2d12' },
};

export const WhiteboardStickyNote: React.FC<WhiteboardStickyNoteProps> = ({
  element,
  isSelected,
  onUpdate,
  onConvertToTask,
  onDelete,
  readOnly = false,
}) => {
  const [colorMenuAnchor, setColorMenuAnchor] = useState<null | HTMLElement>(null);

  const bg = element.backgroundColor || STICKY_COLORS.yellow.bg;
  const textColor = element.color || STICKY_COLORS.yellow.text;

  const handleColorChange = (colorKey: CanvasStickyColor) => {
    const config = STICKY_COLORS[colorKey];
    onUpdate({
      backgroundColor: config.bg,
      color: config.text,
    });
    setColorMenuAnchor(null);
  };

  return (
    <div
      className={`${styles.stickyNote} ${isSelected ? styles.elementSelected : ''}`}
      style={{
        backgroundColor: bg,
        color: textColor,
      }}
      data-testid={`sticky-note-${element.id}`}
    >
      <textarea
        className={styles.stickyText}
        value={element.text || ''}
        placeholder="Digite sua nota..."
        disabled={readOnly}
        onChange={(e) => onUpdate({ text: e.target.value })}
        style={{ color: textColor }}
      />

      {isSelected && !readOnly && (
        <div className={styles.stickyFooter}>
          <Tooltip title="Converter em Tarefa no Projeto">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onConvertToTask(element);
              }}
              data-testid={`convert-sticky-btn-${element.id}`}
              sx={{
                width: 26,
                height: 26,
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                color: '#6366f1',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' },
              }}
            >
              <AssignmentTurnedInIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Alterar Cor">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setColorMenuAnchor(e.currentTarget);
              }}
              sx={{
                width: 26,
                height: 26,
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                color: textColor,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' },
              }}
            >
              <ColorLensIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Excluir Nota">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(element.id);
              }}
              sx={{
                width: 26,
                height: 26,
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                color: '#dc2626',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' },
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </div>
      )}

      <Menu
        anchorEl={colorMenuAnchor}
        open={Boolean(colorMenuAnchor)}
        onClose={() => setColorMenuAnchor(null)}
      >
        {(Object.keys(STICKY_COLORS) as CanvasStickyColor[]).map((key) => (
          <MenuItem
            key={key}
            onClick={() => handleColorChange(key)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: STICKY_COLORS[key].bg,
                border: '1px solid #cbd5e1',
              }}
            />
            <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{key}</span>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};
