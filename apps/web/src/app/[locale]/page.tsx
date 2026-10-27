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
import StorageIcon from '@mui/icons-material/Storage';
import ApiIcon from '@mui/icons-material/Api';
import SecurityIcon from '@mui/icons-material/Security';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const tHome = await getTranslations('home');

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Banner de Boas-Vindas */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            {tHome('welcome')}
          </Typography>
          <Chip
            icon={<CheckCircleIcon />}
            label="Fase 0 Concluída"
            color="success"
            size="small"
            variant="outlined"
          />
        </Box>
        <Typography variant="body1" color="text.secondary">
          {tHome('foundationDescription')}
        </Typography>
      </Box>

      {/* Grid de Cartões de Infraestrutura */}
      <Grid container spacing={3}>
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
                Express com TypeScript rodando em arquitetura modular limpa (routes, controllers,
                services e repositories). Documentação OpenAPI gerada a partir dos schemas Zod
                compartilhados.
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

        {/* Database & Multi-tenancy */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <StorageIcon color="secondary" />
                <Typography variant="h3" sx={{ fontSize: '1.25rem' }}>
                  PostgreSQL 16 & Prisma
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Schema relacional completo com enums nativos, soft delete, multi-tenancy isolado por
                workspace, índices de performance e script de seed determinístico pronto para
                execução.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="PostgreSQL 16" size="small" variant="filled" />
                <Chip label="Prisma 6" size="small" variant="filled" />
                <Chip label="Seed Inicial Pronto" size="small" color="primary" variant="outlined" />
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
