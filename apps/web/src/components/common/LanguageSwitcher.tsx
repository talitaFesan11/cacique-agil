'use client';

import React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TranslateIcon from '@mui/icons-material/Translate';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export function LanguageSwitcher() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common.language');

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (nextLocale: 'pt-BR' | 'en') => {
    handleClose();
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div>
      <Button
        id="language-button"
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        color="inherit"
        startIcon={<TranslateIcon fontSize="small" />}
        size="small"
      >
        {locale === 'pt-BR' ? 'PT' : 'EN'}
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        <MenuItem selected={locale === 'pt-BR'} onClick={() => changeLanguage('pt-BR')}>
          {t('ptBR')}
        </MenuItem>
        <MenuItem selected={locale === 'en'} onClick={() => changeLanguage('en')}>
          {t('en')}
        </MenuItem>
      </Menu>
    </div>
  );
}
