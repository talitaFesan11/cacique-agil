'use client';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useTranslations } from 'next-intl';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');

  const shortcuts = [
    { key: 'C', description: t('shortcutCreate') },
    { key: '/', description: t('shortcutSearch') },
    { key: 'Esc', description: t('shortcutClose') },
    { key: '?', description: t('shortcutHelp') },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('shortcutsTitle')}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {shortcuts.map((s) => (
            <Box
              key={s.key}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Typography variant="body2">{s.description}</Typography>
              <Chip
                label={s.key}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 44 }}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tCommon('actions.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
