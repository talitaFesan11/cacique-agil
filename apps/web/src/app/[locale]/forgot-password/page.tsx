'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { authApi, ApiClientError } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSubmitted(true);
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
    <Box sx={{ maxWidth: 460, mx: 'auto', mt: { xs: 2, md: 6 } }}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <MailOutlineIcon color="primary" />
            <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {t('forgotTitle')}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('forgotSubtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          {submitted ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              {t('forgotSuccess')}
            </Alert>
          ) : (
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}
            >
              <TextField
                type="email"
                label={t('emailLabel')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !email}
                fullWidth
              >
                {loading ? t('sendingEmail') : t('forgotButton')}
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
    </Box>
  );
}
