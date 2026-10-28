'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslations } from 'next-intl';
import { ProjectBaselineDto } from '@fluxo/shared';

interface GanttBaselineDialogProps {
  open: boolean;
  onClose: () => void;
  baselines: ProjectBaselineDto[];
  onCreateBaseline: (name: string, description?: string) => Promise<void>;
  onDeleteBaseline: (id: string) => Promise<void>;
}

export function GanttBaselineDialog({
  open,
  onClose,
  baselines,
  onCreateBaseline,
  onDeleteBaseline,
}: GanttBaselineDialogProps) {
  const t = useTranslations('gantt');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await onCreateBaseline(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar linha de base');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleCreate}>
        <DialogTitle>{t('saveBaselineTitle')}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Typography variant="body2" color="text.secondary">
              A linha de base congela as datas de início e término atuais de todas as tarefas
              para comparação futura de plano vs. real no Gantt.
            </Typography>

            <TextField
              label={t('baselineName')}
              placeholder={t('baselinePlaceholder')}
              size="small"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-baseline-name"
            />

            <TextField
              label={t('baselineDesc')}
              size="small"
              fullWidth
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-baseline-desc"
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading || !name.trim()}
              data-testid="submit-create-baseline"
              sx={{ alignSelf: 'flex-start' }}
            >
              {loading ? 'Salvando...' : 'Salvar Novo Snapshot'}
            </Button>

            {/* Lista de Baselines Existentes */}
            {baselines.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Linhas de Base Existentes:
                </Typography>
                <List dense sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {baselines.map((b) => (
                    <ListItem
                      key={b.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          color="error"
                          onClick={() => onDeleteBaseline(b.id)}
                          data-testid={`delete-baseline-${b.id}`}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={b.name}
                        secondary={`${new Date(b.createdAt).toLocaleDateString('pt-BR')} — ${b.itemCount ?? 0} tarefas registradas`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Fechar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
