'use client';

import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTranslations } from 'next-intl';
import { useColorMode } from '@/theme/ThemeRegistry';

export function ThemeToggle() {
  const { mode, toggleColorMode } = useColorMode();
  const t = useTranslations('common.theme');

  return (
    <Tooltip title={t('toggle')}>
      <IconButton onClick={toggleColorMode} color="inherit" aria-label={t('toggle')} size="small">
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}
