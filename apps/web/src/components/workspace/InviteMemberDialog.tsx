'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { useTranslations } from 'next-intl';
import { WorkspaceRole, WorkspaceInviteDto } from '@fluxo/shared';
import { workspacesApi, ApiClientError } from '@/lib/api-client';

interface InviteMemberDialogProps {
  open: boolean;
  workspaceIdOrSlug: string;
  actorRole: WorkspaceRole;
  onClose: () => void;
  onInvited: (invite: WorkspaceInviteDto) => void;
}

export function InviteMemberDialog({
  open,
  workspaceIdOrSlug,
  actorRole,
  onClose,
  onInvited,
}: InviteMemberDialogProps) {
  const t = useTranslations('workspace');
  const tCommon = useTranslations('common');

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>(WorkspaceRole.MEMBER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRoles = [
    ...(actorRole === WorkspaceRole.OWNER
      ? [{ value: WorkspaceRole.OWNER, label: t('roleOwner') }]
      : []),
    { value: WorkspaceRole.ADMIN, label: t('roleAdmin') },
    { value: WorkspaceRole.MEMBER, label: t('roleMember') },
    { value: WorkspaceRole.GUEST, label: t('roleGuest') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const invite = await workspacesApi.createInvite(workspaceIdOrSlug, {
        email: email.trim(),
        role,
      });
      setEmail('');
      setRole(WorkspaceRole.MEMBER);
      onInvited(invite);
      onClose();
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
        <DialogTitle sx={{ fontWeight: 700 }}>{t('inviteDialogTitle')}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              type="email"
              label={t('inviteEmailLabel')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
            />

            <TextField
              select
              label={t('inviteRoleLabel')}
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              fullWidth
            >
              {availableRoles.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={loading}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading || !email.trim()}>
            {loading ? t('sendingInvite') : t('sendInvite')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
