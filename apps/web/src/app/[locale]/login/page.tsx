'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { authApi, ApiClientError } from '@/lib/api-client';
import { useAuthStore, mapMembershipsToWorkspaces } from '@/features/auth/auth-store';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login({ email: email.trim(), password });
      const workspaces = mapMembershipsToWorkspaces(res.workspaces);
      setSession({
        accessToken: res.accessToken,
        user: res.user,
        workspaces,
      });

      const firstWs = workspaces[0];
      if (firstWs) {
        router.push(`/${locale}/workspaces/${firstWs.slug}/settings`);
      } else {
        router.push(`/${locale}`);
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
    <Box
      sx={{
        maxWidth: 460,
        mx: 'auto',
        mt: { xs: 2, md: 6 },
      }}
    >
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <LockOutlinedIcon color="primary" />
            <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {t('loginTitle')}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('loginSubtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }} data-testid="login-error-alert">
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              type="email"
              label={t('emailLabel')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              inputProps={{ 'data-testid': 'login-email-input' }}
            />

            <TextField
              type="password"
              label={t('passwordLabel')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              inputProps={{ 'data-testid': 'login-password-input' }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography
                component={Link}
                href={`/${locale}/forgot-password`}
                variant="body2"
                color="primary"
                sx={{ textDecoration: 'none', fontWeight: 500 }}
              >
                {t('forgotPasswordLink')}
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !email || !password}
              data-testid="login-submit-button"
              fullWidth
            >
              {loading ? t('loggingIn') : t('loginButton')}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
              {t('demoCredentialsTitle')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={t('fillDemoOwner')}
                size="small"
                color="primary"
                variant="outlined"
                onClick={() => {
                  setEmail('admin@fluxopro.local');
                  setPassword('Senha@123');
                }}
                data-testid="fill-demo-owner"
              />
              <Chip
                label={t('fillDemoMember')}
                size="small"
                color="secondary"
                variant="outlined"
                onClick={() => {
                  setEmail('membro@fluxopro.local');
                  setPassword('Senha@123');
                }}
                data-testid="fill-demo-member"
              />
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('noAccount')}{' '}
              <Typography
                component={Link}
                href={`/${locale}/register`}
                variant="body2"
                color="primary"
                sx={{ textDecoration: 'none', fontWeight: 600 }}
              >
                {t('createAccountLink')}
              </Typography>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
