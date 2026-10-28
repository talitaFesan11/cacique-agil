'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid2';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  WorkspaceDto,
  WorkspaceInviteDto,
  WorkspaceMemberDto,
  WorkspaceRole,
} from '@fluxo/shared';
import { workspacesApi, ApiClientError } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';
import { InviteMemberDialog } from '@/components/workspace/InviteMemberDialog';

export default function WorkspaceSettingsPage() {
  const t = useTranslations('workspace');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const params = useParams<{ slug: string }>();
  const slugParam = params?.slug || '';

  const user = useAuthStore((s) => s.user);
  const workspaces = useAuthStore((s) => s.workspaces);
  const setWorkspaces = useAuthStore((s) => s.setWorkspaces);
  const setActiveWorkspaceId = useAuthStore((s) => s.setActiveWorkspaceId);

  const [workspace, setWorkspace] = useState<WorkspaceDto | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([]);
  const [invites, setInvites] = useState<WorkspaceInviteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [wsName, setWsName] = useState('');
  const [wsSlug, setWsSlug] = useState('');
  const [savingWs, setSavingWs] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadWorkspaceData = useCallback(async () => {
    if (!slugParam) return;
    setLoading(true);
    setError(null);

    try {
      const [wsData, membersData, invitesData] = await Promise.all([
        workspacesApi.getById(slugParam),
        workspacesApi.listMembers(slugParam),
        workspacesApi.listInvites(slugParam),
      ]);

      setWorkspace(wsData);
      setWsName(wsData.name);
      setWsSlug(wsData.slug);
      setMembers(membersData);
      setInvites(invitesData);
      setActiveWorkspaceId(wsData.id);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(tCommon('status.error'));
      }
    } finally {
      setLoading(false);
    }
  }, [slugParam, setActiveWorkspaceId, tCommon]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  const userRole = workspace?.role || WorkspaceRole.GUEST;
  const canManage =
    userRole === WorkspaceRole.OWNER || userRole === WorkspaceRole.ADMIN;

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !canManage) return;

    setSavingWs(true);
    setFeedback(null);
    try {
      const updated = await workspacesApi.update(workspace.id, {
        name: wsName.trim(),
        slug: wsSlug.trim(),
      });
      setWorkspace(updated);
      setWorkspaces(
        workspaces.map((w) => (w.id === updated.id ? { ...w, ...updated } : w)),
      );
      setFeedback({ type: 'success', message: t('updatedSuccess') });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof ApiClientError ? err.message : tCommon('status.error'),
      });
    } finally {
      setSavingWs(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    if (!workspace) return;
    setFeedback(null);
    try {
      const updatedMember = await workspacesApi.updateMemberRole(workspace.id, memberId, {
        role: newRole,
      });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updatedMember : m)));
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof ApiClientError ? err.message : tCommon('status.error'),
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!workspace) return;
    setFeedback(null);
    try {
      await workspacesApi.removeMember(workspace.id, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof ApiClientError ? err.message : tCommon('status.error'),
      });
    }
  };

  const handleCopyInviteLink = (inviteToken: string, id: string) => {
    const url = `${window.location.origin}/${locale}/invites/${inviteToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Skeleton variant="text" width={360} height={48} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={520} height={24} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !workspace) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
        <Alert
          severity="error"
          data-testid="workspace-access-error"
          action={
            <Button color="inherit" size="small" onClick={loadWorkspaceData}>
              {tCommon('status.retry')}
            </Button>
          }
        >
          {error || tCommon('status.empty')}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <SecurityOutlinedIcon color="primary" />
            <Typography variant="h1" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              {t('settingsTitle')}
            </Typography>
            <Chip
              label={workspace.role}
              color="primary"
              size="small"
              data-testid="active-workspace-role-chip"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('settingsSubtitle')}
          </Typography>
        </Box>

        {canManage && (
          <Button
            variant="contained"
            startIcon={<PersonAddOutlinedIcon />}
            onClick={() => setInviteOpen(true)}
            data-testid="open-invite-dialog-button"
          >
            {t('inviteButton')}
          </Button>
        )}
      </Box>

      {!canManage && (
        <Alert severity="info" sx={{ mb: 3 }} data-testid="rbac-readonly-notice">
          {t('readonlyNotice', { role: workspace.role || 'GUEST' })}
        </Alert>
      )}

      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          sx={{ mb: 3 }}
          data-testid="workspace-feedback-alert"
        >
          {feedback.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Dados Gerais da Organização */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <BusinessOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="h3" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {t('generalSection')}
                </Typography>
              </Box>

              <Box
                component="form"
                onSubmit={handleSaveWorkspace}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2,
                  alignItems: { xs: 'stretch', md: 'flex-start' },
                }}
              >
                <TextField
                  label={t('nameLabel')}
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  disabled={!canManage || savingWs}
                  required
                  fullWidth
                  size="small"
                  inputProps={{ 'data-testid': 'workspace-name-input' }}
                />

                <TextField
                  label={t('slugLabel')}
                  value={wsSlug}
                  onChange={(e) => setWsSlug(e.target.value.toLowerCase())}
                  disabled={!canManage || savingWs}
                  required
                  fullWidth
                  size="small"
                  inputProps={{ 'data-testid': 'workspace-slug-input' }}
                />

                {canManage && (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={savingWs || wsName.trim().length < 2}
                    sx={{ minWidth: 160, height: 40 }}
                    data-testid="save-workspace-button"
                  >
                    {savingWs ? t('savingChanges') : t('saveChanges')}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Lista de Membros & RBAC */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GroupOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="h3" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {t('membersSection')} ({members.length})
                </Typography>
              </Box>

              {members.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('noMembers')}
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small" aria-label={t('membersSection')}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t('memberName')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('memberEmail')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('memberRole')}</TableCell>
                        {canManage && (
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {t('memberActions')}
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {members.map((member) => {
                        const isSelf = member.userId === user?.id;
                        const isTargetOwner = member.role === WorkspaceRole.OWNER;
                        const canEditMember =
                          canManage &&
                          !(userRole === WorkspaceRole.ADMIN && isTargetOwner);

                        return (
                          <TableRow key={member.id} data-testid={`member-row-${member.user.email}`}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    fontSize: '0.75rem',
                                    bgcolor: 'primary.main',
                                  }}
                                >
                                  {member.user.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {member.user.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {member.user.email}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {canEditMember ? (
                                <TextField
                                  select
                                  size="small"
                                  value={member.role}
                                  onChange={(e) =>
                                    handleRoleChange(
                                      member.id,
                                      e.target.value as WorkspaceRole,
                                    )
                                  }
                                  sx={{ minWidth: 160 }}
                                  inputProps={{
                                    'aria-label': `${t('memberRole')} ${member.user.name}`,
                                  }}
                                >
                                  {userRole === WorkspaceRole.OWNER && (
                                    <MenuItem value={WorkspaceRole.OWNER}>
                                      {t('roleOwner')}
                                    </MenuItem>
                                  )}
                                  <MenuItem value={WorkspaceRole.ADMIN}>
                                    {t('roleAdmin')}
                                  </MenuItem>
                                  <MenuItem value={WorkspaceRole.MEMBER}>
                                    {t('roleMember')}
                                  </MenuItem>
                                  <MenuItem value={WorkspaceRole.GUEST}>
                                    {t('roleGuest')}
                                  </MenuItem>
                                </TextField>
                              ) : (
                                <Chip
                                  label={member.role}
                                  size="small"
                                  color={
                                    member.role === WorkspaceRole.OWNER
                                      ? 'primary'
                                      : 'default'
                                  }
                                />
                              )}
                            </TableCell>
                            {canManage && (
                              <TableCell align="right">
                                {canEditMember && !isSelf && (
                                  <IconButton
                                    color="error"
                                    size="small"
                                    aria-label={t('removeMember')}
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Convites Pendentes */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MailOutlineIcon color="secondary" fontSize="small" />
                <Typography variant="h3" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {t('invitesSection')} ({invites.length})
                </Typography>
              </Box>

              {invites.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('noInvites')}
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small" aria-label={t('invitesSection')}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t('memberEmail')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('memberRole')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {t('inviteLink')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invites.map((inv) => (
                        <TableRow key={inv.id} data-testid={`invite-row-${inv.email}`}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {inv.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={inv.role} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ContentCopyIcon fontSize="small" />}
                              onClick={() => handleCopyInviteLink(inv.token, inv.id)}
                            >
                              {copiedId === inv.id ? t('copied') : t('copyLink')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <InviteMemberDialog
        open={inviteOpen}
        workspaceIdOrSlug={workspace.id}
        actorRole={userRole}
        onClose={() => setInviteOpen(false)}
        onInvited={(newInvite) => {
          setInvites((prev) => [newInvite, ...prev]);
          setFeedback({ type: 'success', message: t('inviteSentSuccess') });
        }}
      />
    </Box>
  );
}
