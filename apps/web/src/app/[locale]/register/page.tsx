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
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { authApi, ApiClientError } from '@/lib/api-client';
import { useAuthStore, mapMembershipsToWorkspaces } from '@/features/auth/auth-store';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        locale: (locale === 'en' ? 'en' : 'pt-BR'),
      });
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
            <PersonAddAlt1OutlinedIcon color="primary" />
            <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {t('registerTitle')}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('registerSubtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              label={t('nameLabel')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoComplete="name"
              inputProps={{ minLength: 2, 'data-testid': 'register-name-input' }}
            />

            <TextField
              type="email"
              label={t('emailLabel')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              inputProps={{ 'data-testid': 'register-email-input' }}
            />

            <TextField
              type="password"
              label={t('passwordLabel')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
              inputProps={{ minLength: 8, 'data-testid': 'register-password-input' }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || name.trim().length < 2 || !email || password.length < 8}
              data-testid="register-submit-button"
              fullWidth
            >
              {loading ? t('registering') : t('registerButton')}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('hasAccount')}{' '}
              <Typography
                component={Link}
                href={`/${locale}/login`}
                variant="body2"
                color="primary"
                sx={{ textDecoration: 'none', fontWeight: 600 }}
              >
                {t('signInLink')}
              </Typography>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
