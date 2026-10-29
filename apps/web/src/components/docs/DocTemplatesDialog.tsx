import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid2';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { PredefinedTemplateDto } from '@fluxo/shared';

interface DocTemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  templates: {
    predefined: PredefinedTemplateDto[];
    custom: PredefinedTemplateDto[];
  };
  onSelectTemplate: (template: PredefinedTemplateDto) => void;
}

export const DocTemplatesDialog: React.FC<DocTemplatesDialogProps> = ({
  open,
  onClose,
  templates,
  onSelectTemplate,
}) => {
  const allTemplates = [
    {
      id: 'blank',
      title: 'Documento em Branco',
      description: 'Comece do zero com uma página limpa e flexível.',
      category: 'GENERAL' as const,
      icon: '📄',
      contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
    },
    ...templates.predefined,
    ...templates.custom,
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Galeria de Modelos de Documento
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Escolha um modelo estruturado para acelerar o alinhamento da sua equipe.
        </Typography>

        <Grid container spacing={2}>
          {allTemplates.map((template) => (
            <Grid key={template.id} size={{ xs: 12, sm: 6 }}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 2.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 6px 16px rgba(99, 102, 241, 0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea
                  data-testid={`template-card-${template.id}`}
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  sx={{ height: '100%', p: 1 }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: '1.8rem' }}>{template.icon}</Typography>
                      <Chip
                        label={template.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {template.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 600 }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
