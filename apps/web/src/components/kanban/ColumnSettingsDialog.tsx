'use client';

import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { StatusCategory, WorkflowStatusDto } from '@fluxo/shared';

interface ColumnSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  status: WorkflowStatusDto | null; // null se criando nova coluna
  onSave: (data: {
    name: string;
    category: StatusCategory;
    color: string;
    wipLimit: number | null;
  }) => Promise<void>;
  onDelete?: (statusId: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#64748B', // Slate
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#06B6D4', // Cyan
];

export const ColumnSettingsDialog: React.FC<ColumnSettingsDialogProps> = ({
  open,
  onClose,
  status,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(status);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StatusCategory>(StatusCategory.TODO);
  const [color, setColor] = useState('#3B82F6');
  const [wipLimit, setWipLimit] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status) {
      setName(status.name);
      setCategory(status.category);
      setColor(status.color || '#3B82F6');
      setWipLimit(status.wipLimit ? String(status.wipLimit) : '');
    } else {
      setName('');
      setCategory(StatusCategory.TODO);
      setColor('#3B82F6');
      setWipLimit('');
    }
    setError(null);
  }, [status, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da coluna é obrigatório.');
      return;
    }

    const parsedWip = wipLimit.trim() === '' ? null : parseInt(wipLimit, 10);
    if (parsedWip !== null && (isNaN(parsedWip) || parsedWip < 1)) {
      setError('O limite WIP deve ser um número inteiro positivo.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        name: name.trim(),
        category,
        color,
        wipLimit: parsedWip,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar coluna');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!status || !onDelete) return;
    if (!window.confirm(`Tem certeza que deseja excluir a coluna "${status.name}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await onDelete(status.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir coluna');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving || deleting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      data-testid="column-settings-dialog"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? `Configurar Coluna: ${status?.name}` : 'Nova Coluna'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            autoFocus
            label="Nome da Coluna"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            inputProps={{ 'data-testid': 'column-name-input' }}
          />

          <TextField
            select
            label="Categoria do Fluxo"
            value={category}
            onChange={(e) => setCategory(e.target.value as StatusCategory)}
            fullWidth
            inputProps={{ 'data-testid': 'column-category-select' }}
          >
            <MenuItem value={StatusCategory.TODO}>A Fazer (TODO)</MenuItem>
            <MenuItem value={StatusCategory.IN_PROGRESS}>Em Andamento (IN_PROGRESS)</MenuItem>
            <MenuItem value={StatusCategory.DONE}>Concluído (DONE)</MenuItem>
          </TextField>

          <TextField
            label="Limite WIP (Cards em progresso)"
            type="number"
            value={wipLimit}
            onChange={(e) => setWipLimit(e.target.value)}
            helperText="Deixe em branco para sem limite"
            fullWidth
            inputProps={{ min: 1, 'data-testid': 'column-wip-input' }}
          />

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              Cor da Coluna
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {PRESET_COLORS.map((preset) => (
                <Box
                  key={preset}
                  onClick={() => setColor(preset)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: preset,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: color === preset ? 'primary.main' : 'transparent',
                    boxShadow: color === preset ? '0 0 0 2px rgba(37,99,235,0.3)' : 'none',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
          {isEditing && onDelete ? (
            <Button
              color="error"
              onClick={handleDelete}
              disabled={saving || deleting}
              data-testid="delete-column-button"
            >
              Excluir
            </Button>
          ) : (
            <Box />
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={saving || deleting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving || deleting}
              data-testid="save-column-button"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};
