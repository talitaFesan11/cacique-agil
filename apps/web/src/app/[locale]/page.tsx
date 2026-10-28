'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ApiIcon from '@mui/icons-material/Api';
import SecurityIcon from '@mui/icons-material/Security';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LoginIcon from '@mui/icons-material/Login';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/auth-store';

export default function HomePage() {
  const tHome = useTranslations('home');
  const tAuth = useTranslations('auth');
  const locale = useLocale();

  const user = useAuthStore((s) => s.user);
  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId || w.slug === activeWorkspaceId) ||
    workspaces[0] ||
    null;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Banner de Boas-Vindas */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            {tHome('welcome')}
          </Typography>
          <Chip
            icon={<CheckCircleIcon />}
            label={tHome('phaseBadge')}
            color="success"
            size="small"
            variant="outlined"
          />
        </Box>
        <Typography variant="body1" color="text.secondary">
          {tHome('foundationDescription')}
        </Typography>
      </Box>

      {/* Grid Principal */}
      <Grid container spacing={3}>
        {/* Contexto Multi-Tenant & Identidade */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <WorkspacesOutlinedIcon color="primary" />
                <Typography variant="h3" sx={{ fontSize: '1.25rem' }}>
                  {tHome('activeWorkspaceCardTitle')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {tHome('activeWorkspaceDesc')}
              </Typography>

              {user && activeWorkspace ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={`${activeWorkspace.name} (${activeWorkspace.slug})`}
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label={tHome('yourRole', { role: activeWorkspace.role || 'MEMBER' })}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    <Button
                      component={Link}
                      href={`/${locale}/projects`}
                      variant="contained"
                      startIcon={<FolderOpenIcon />}
                      data-testid="home-open-projects-button"
                    >
                      {tHome('openProjectsButton')}
                    </Button>
                    <Button
                      component={Link}
                      href={`/${locale}/workspaces/${activeWorkspace.slug}/settings`}
                      variant="outlined"
                      startIcon={<GroupOutlinedIcon />}
                      data-testid="home-manage-workspace-button"
                    >
                      {tHome('openWorkspaceSettings')}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    component={Link}
                    href={`/${locale}/login`}
                    variant="contained"
                    startIcon={<LoginIcon />}
                    data-testid="home-login-button"
                  >
                    {tAuth('loginButton')}
                  </Button>
                  <Button
                    component={Link}
                    href={`/${locale}/register`}
                    variant="outlined"
                  >
                    {tAuth('createAccountLink')}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Backend & OpenAPI */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <ApiIcon color="primary" />
                <Typography variant="h3" sx={{ fontSize: '1.25rem' }}>
                  {tHome('apiStatusTitle')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                API Express + TypeScript com autenticação Bearer JWT, Refresh Token rotativo em
                cookie httpOnly, RBAC em middleware e especificação OpenAPI 3.0 atualizada.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Button
                  variant="contained"
                  color="primary"
                  href="http://localhost:4000/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon fontSize="small" />}
                >
                  {tHome('checkDocs')}
                </Button>
                <Button
                  variant="outlined"
                  href="http://localhost:4000/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon fontSize="small" />}
                >
                  {tHome('checkHealth')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Próxima Fase */}
        <Grid size={{ xs: 12 }}>
          <Card
            variant="outlined"
            sx={{
              backgroundColor: 'action.hover',
              borderColor: 'primary.light',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h4" sx={{ fontSize: '1.125rem' }}>
                  {tHome('nextPhasesTitle')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {tHome('nextPhasesDesc')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
