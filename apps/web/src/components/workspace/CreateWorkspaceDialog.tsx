'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTranslations } from 'next-intl';
import { workspacesApi, ApiClientError } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (slug: string) => void;
}

export function CreateWorkspaceDialog({
  open,
  onClose,
  onCreated,
}: CreateWorkspaceDialogProps) {
  const t = useTranslations('workspace');
  const tCommon = useTranslations('common');
  const workspaces = useAuthStore((s) => s.workspaces);
  const setWorkspaces = useAuthStore((s) => s.setWorkspaces);
  const setActiveWorkspaceId = useAuthStore((s) => s.setActiveWorkspaceId);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    const autoSlug = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const created = await workspacesApi.create({
        name: name.trim(),
        slug: slug.trim() || undefined,
      });

      setWorkspaces([...workspaces, created]);
      setActiveWorkspaceId(created.id);
      setName('');
      setSlug('');
      onClose();
      if (onCreated) {
        onCreated(created.slug);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(tCommon('status.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('createTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {t('createSubtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label={t('nameLabel')}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              fullWidth
              autoFocus
              inputProps={{ minLength: 2, maxLength: 80 }}
            />
            <TextField
              label={t('slugLabel')}
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              helperText={t('slugHelper')}
              fullWidth
              inputProps={{ maxLength: 60 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={loading}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading || name.trim().length < 2}>
            {loading ? tCommon('status.loading') : tCommon('actions.create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
