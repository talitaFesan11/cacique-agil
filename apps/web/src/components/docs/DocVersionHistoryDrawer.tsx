import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import HistoryIcon from '@mui/icons-material/History';
import { DocumentVersionDto } from '@fluxo/shared';

interface DocVersionHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  versions: DocumentVersionDto[];
  loading?: boolean;
  onCreateVersion: (name: string) => void;
  onRestoreVersion: (versionId: string) => void;
}

export const DocVersionHistoryDrawer: React.FC<DocVersionHistoryDrawerProps> = ({
  open,
  onClose,
  versions,
  loading = false,
  onCreateVersion,
  onRestoreVersion,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersionDto | null>(null);

  const handleConfirmCreate = () => {
    if (versionName.trim()) {
      onCreateVersion(versionName.trim());
      setVersionName('');
      setCreateDialogOpen(false);
    }
  };

  const handleConfirmRestore = (versionId: string) => {
    onRestoreVersion(versionId);
    onClose();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 380 }, p: 0 },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Histórico de Versões
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Botão de Snapshot Manual */}
          <Box sx={{ p: 2, pb: 1 }}>
            <Button
              data-testid="create-version-button"
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Criar Versão Manual
            </Button>
          </Box>

          {/* Lista de Versões */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {loading ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Carregando histórico...
              </Typography>
            ) : versions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Nenhuma versão salva até o momento.
              </Typography>
            ) : (
              versions.map((v) => (
                <Box
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  sx={{
                    p: 1.5,
                    mb: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: selectedVersion?.id === v.id ? 'primary.main' : 'divider',
                    bgcolor:
                      selectedVersion?.id === v.id
                        ? (theme) => (theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.50')
                        : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      v{v.versionNumber} {v.name ? `— ${v.name}` : ''}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {new Date(v.createdAt).toLocaleString('pt-BR')}
                  </Typography>

                  {v.createdBy && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                      Por {v.createdBy.name}
                    </Typography>
                  )}

                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      data-testid={`restore-version-${v.id}`}
                      size="small"
                      variant="text"
                      color="primary"
                      startIcon={<RestoreIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmRestore(v.id);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                    >
                      Restaurar
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Modal para Nome da Versão Manual */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Salvar Versão Atual</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            data-testid="version-name-input"
            autoFocus
            fullWidth
            size="small"
            label="Nome ou Rótulo da Versão"
            placeholder="Ex: Revisão final da Sprint, Aprovado pelo time..."
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmCreate();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button data-testid="confirm-create-version-button" variant="contained" onClick={handleConfirmCreate}>
            Salvar Snapshot
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
