import React, { useState } from 'react';
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
import IosShareIcon from '@mui/icons-material/IosShare';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import { documentsApi } from '@/lib/api-client';

interface DocExportDialogProps {
  open: boolean;
  onClose: () => void;
  docId: string;
  docTitle: string;
}

export const DocExportDialog: React.FC<DocExportDialogProps> = ({
  open,
  onClose,
  docId,
  docTitle,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleExportMarkdown = async () => {
    try {
      setDownloading(true);
      const content = await documentsApi.export(docId, 'markdown');
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error('Erro ao exportar markdown:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintPdf = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleExportJson = async () => {
    try {
      setDownloading(true);
      const content = await documentsApi.export(docId, 'json');
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error('Erro ao exportar json:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IosShareIcon color="primary" />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Exportar &ldquo;{docTitle}&rdquo;
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Selecione o formato desejado para salvar ou compartilhar este documento:
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardActionArea data-testid="export-markdown-option" onClick={handleExportMarkdown} disabled={downloading} sx={{ p: 1 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DescriptionIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Arquivo Markdown (.md)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Formato texto padrão, compatível com GitHub, Notion e editores de código.
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardActionArea onClick={handlePrintPdf} sx={{ p: 1 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PictureAsPdfIcon color="error" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Impressão & Salvar como PDF
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gera um PDF formatado e limpo, sem cabeçalhos ou barras de ferramentas.
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardActionArea onClick={handleExportJson} disabled={downloading} sx={{ p: 1 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CodeIcon color="action" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      JSON Estruturado ProseMirror
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Árvore sintática completa do documento para integrações e backups de dados.
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 600 }}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
