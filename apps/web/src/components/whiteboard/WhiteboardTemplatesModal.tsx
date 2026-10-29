'use client';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { PredefinedWhiteboardTemplateDto } from '@fluxo/shared';

interface WhiteboardTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  templates: PredefinedWhiteboardTemplateDto[];
  onSelectTemplate: (template: PredefinedWhiteboardTemplateDto) => void;
}

export const WhiteboardTemplatesModal: React.FC<WhiteboardTemplatesModalProps> = ({
  open,
  onClose,
  templates,
  onSelectTemplate,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Galeria de Modelos de Quadros</span>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Escolha um modelo pré-estruturado para acelerar seu fluxo de trabalho, retrospectivas ou sessões de ideação.
        </Typography>

        <Grid container spacing={2}>
          {templates.map((tpl) => (
            <Grid item xs={12} sm={6} key={tpl.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.12)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => {
                    onSelectTemplate(tpl);
                    onClose();
                  }}
                  sx={{ height: '100%', p: 1 }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <span style={{ fontSize: 28 }}>{tpl.icon}</span>
                      <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
                        {tpl.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {tpl.description}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'primary.main', fontWeight: 600 }}>
                      {tpl.elements.length} elementos pré-configurados →
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
