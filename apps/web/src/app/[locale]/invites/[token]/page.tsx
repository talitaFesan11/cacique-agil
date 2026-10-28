'use client';

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceInviteDto } from '@fluxo/shared';
import { workspacesApi, ApiClientError } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';

export default function AcceptInvitePage() {
  const t = useTranslations('workspace');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token || '';

  const user = useAuthStore((s) => s.user);
  const setWorkspaces = useAuthStore((s) => s.setWorkspaces);
  const setActiveWorkspaceId = useAuthStore((s) => s.setActiveWorkspaceId);

  const [invite, setInvite] = useState<WorkspaceInviteDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadInvite() {
      setLoading(true);
      setError(null);
      try {
        const data = await workspacesApi.getInviteByToken(token);
        if (active) setInvite(data);
      } catch (err) {
        if (active) {
          setError(err instanceof ApiClientError ? err.message : tCommon('status.error'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (token) loadInvite();
    return () => {
      active = false;
    };
  }, [token, tCommon]);

  const handleAccept = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    setAccepting(true);
    setError(null);
    try {
      const res = await workspacesApi.acceptInvite(token);
      const updatedList = await workspacesApi.list();
      setWorkspaces(updatedList);
      setActiveWorkspaceId(res.workspace.id);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/workspaces/${res.workspace.slug}/settings`);
      }, 1000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : tCommon('status.error'));
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: { xs: 2, md: 6 } }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <GroupAddOutlinedIcon color="primary" />
            <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {t('acceptInviteTitle')}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="text" height={32} />
              <Skeleton variant="rectangular" height={80} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : invite ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="body1" color="text.secondary">
                {t('acceptInviteDesc')}
              </Typography>

              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {invite.workspace?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('memberEmail')}: <strong>{invite.email}</strong>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip label={invite.role} color="primary" size="small" />
                </Box>
              </Box>

              {success ? (
                <Alert severity="success">{t('inviteAcceptedSuccess')}</Alert>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAccept}
                  disabled={accepting}
                  data-testid="accept-invite-button"
                >
                  {accepting ? t('acceptingInvite') : t('acceptInviteButton')}
                </Button>
              )}
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  );
}
