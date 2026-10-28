'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useTranslations } from 'next-intl';
import { DependencyType, GanttTaskItemDto } from '@fluxo/shared';

interface GanttDependencyDialogProps {
  open: boolean;
  onClose: () => void;
  tasks: GanttTaskItemDto[];
  onSubmit: (data: {
    predecessorId: string;
    successorId: string;
    type: DependencyType;
    lagDays: number;
  }) => Promise<void>;
  defaultPredecessorId?: string;
  defaultSuccessorId?: string;
}

export function GanttDependencyDialog({
  open,
  onClose,
  tasks,
  onSubmit,
  defaultPredecessorId = '',
  defaultSuccessorId = '',
}: GanttDependencyDialogProps) {
  const t = useTranslations('gantt');
  const [predecessorId, setPredecessorId] = useState(defaultPredecessorId);
  const [successorId, setSuccessorId] = useState(defaultSuccessorId);
  const [type, setType] = useState<DependencyType>(DependencyType.FS);
  const [lagDays, setLagDays] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setPredecessorId(defaultPredecessorId);
      setSuccessorId(defaultSuccessorId);
      setType(DependencyType.FS);
      setLagDays(0);
      setError(null);
    }
  }, [open, defaultPredecessorId, defaultSuccessorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!predecessorId || !successorId) {
      setError('Selecione ambas as tarefas');
      return;
    }
    if (predecessorId === successorId) {
      setError('Uma tarefa não pode depender de si mesma');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        predecessorId,
        successorId,
        type,
        lagDays: Number(lagDays) || 0,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar dependência';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t('addDependencyTitle')}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* Tarefa Predecessora */}
            <FormControl fullWidth size="small" required>
              <InputLabel id="pred-select-label">{t('selectPredecessor')}</InputLabel>
              <Select
                labelId="pred-select-label"
                value={predecessorId}
                label={t('selectPredecessor')}
                onChange={(e) => setPredecessorId(e.target.value)}
                data-testid="select-predecessor"
              >
                {tasks.map((task) => (
                  <MenuItem
                    key={task.id}
                    value={task.id}
                    disabled={task.id === successorId}
                  >
                    <strong>{task.key}</strong> — {task.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Tarefa Sucessora */}
            <FormControl fullWidth size="small" required>
              <InputLabel id="succ-select-label">{t('selectSuccessor')}</InputLabel>
              <Select
                labelId="succ-select-label"
                value={successorId}
                label={t('selectSuccessor')}
                onChange={(e) => setSuccessorId(e.target.value)}
                data-testid="select-successor"
              >
                {tasks.map((task) => (
                  <MenuItem
                    key={task.id}
                    value={task.id}
                    disabled={task.id === predecessorId}
                  >
                    <strong>{task.key}</strong> — {task.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Tipo de Dependência */}
            <FormControl fullWidth size="small">
              <InputLabel id="type-select-label">{t('typeFS')}</InputLabel>
              <Select
                labelId="type-select-label"
                value={type}
                label={t('typeFS')}
                onChange={(e) => setType(e.target.value as DependencyType)}
                data-testid="select-dependency-type"
              >
                <MenuItem value={DependencyType.FS}>{t('typeFS')}</MenuItem>
                <MenuItem value={DependencyType.SS}>{t('typeSS')}</MenuItem>
                <MenuItem value={DependencyType.FF}>{t('typeFF')}</MenuItem>
                <MenuItem value={DependencyType.SF}>{t('typeSF')}</MenuItem>
              </Select>
            </FormControl>

            {/* Deslocamento em dias (lag) */}
            <TextField
              label={t('lagDays')}
              type="number"
              size="small"
              value={lagDays}
              onChange={(e) => setLagDays(Number(e.target.value))}
              helperText="Número de dias de atraso ou adiantamento entre as tarefas"
              inputProps={{ min: -30, max: 365 }}
              data-testid="input-lag-days"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !predecessorId || !successorId}
            data-testid="submit-dependency-button"
          >
            {loading ? 'Salvando...' : 'Adicionar Dependência'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
