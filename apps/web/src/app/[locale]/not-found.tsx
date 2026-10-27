import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <Typography variant="h1" sx={{ fontSize: '4rem', fontWeight: 800, mb: 1 }}>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
        Página não encontrada
      </Typography>
      <Button component={Link} href="/" variant="contained">
        Voltar para o Início
      </Button>
    </Box>
  );
}
