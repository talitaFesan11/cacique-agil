'use client';

import React, { Suspense, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi, ApiClientError } from '@/lib/api-client';

function ResetPasswordForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.resetPassword({
        token: tokenFromUrl,
        password,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 1500);
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
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <KeyOutlinedIcon color="primary" />
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {t('resetTitle')}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('resetSubtitle')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            {t('resetSuccess')}
          </Alert>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}
          >
            <TextField
              type="password"
              label={t('newPasswordLabel')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 8 }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || password.length < 8 || !tokenFromUrl}
              fullWidth
            >
              {loading ? t('resetting') : t('resetButton')}
            </Button>
          </Box>
        )}

        <Box sx={{ textAlign: 'center' }}>
          <Typography
            component={Link}
            href={`/${locale}/login`}
            variant="body2"
            color="primary"
            sx={{ textDecoration: 'none', fontWeight: 600 }}
          >
            {t('backToLogin')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Box sx={{ maxWidth: 460, mx: 'auto', mt: { xs: 2, md: 6 } }}>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </Box>
  );
}
