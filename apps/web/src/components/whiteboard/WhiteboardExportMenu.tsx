'use client';

import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';

interface WhiteboardExportMenuProps {
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
}

export const WhiteboardExportMenu: React.FC<WhiteboardExportMenuProps> = ({
  onExportPng,
  onExportSvg,
  onExportJson,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<FileDownloadIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ textTransform: 'none', height: 32 }}
      >
        Exportar
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onExportPng();
          }}
        >
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Imagem PNG" secondary="Alta definição" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onExportSvg();
          }}
        >
          <ListItemIcon>
            <CodeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Vetor SVG" secondary="Resolução infinita" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onExportJson();
          }}
        >
          <ListItemIcon>
            <DataObjectIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Arquivo JSON" secondary="Backup estruturado" />
        </MenuItem>
      </Menu>
    </>
  );
};
