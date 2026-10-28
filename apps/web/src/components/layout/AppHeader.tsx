'use client';

import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { WorkspaceSelector } from '../workspace/WorkspaceSelector';
import { useAuthStore } from '@/features/auth/auth-store';
import { authApi } from '@/lib/api-client';

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const t = useTranslations('common');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [userMenuEl, setUserMenuEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setUserMenuEl(null);
    try {
      await authApi.logout();
    } catch {
      // ignora falha de rede ao deslogar
    }
    clearSession();
    router.push(`/${locale}/login`);
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Abrir menu de navegação"
            onClick={onToggleSidebar}
            size="small"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            href={`/${locale}`}
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'none',
            }}
          >
            {t('appName')}
          </Typography>

          <WorkspaceSelector />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <>
              <Button
                onClick={(e) => setUserMenuEl(e.currentTarget)}
                color="inherit"
                size="small"
                data-testid="user-profile-button"
                sx={{ textTransform: 'none', gap: 1, borderRadius: 2 }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: '0.8rem',
                    bgcolor: 'secondary.main',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, display: { xs: 'none', md: 'block' }, color: 'text.primary' }}
                >
                  {user.name}
                </Typography>
              </Button>

              <Menu
                anchorEl={userMenuEl}
                open={Boolean(userMenuEl)}
                onClose={() => setUserMenuEl(null)}
                PaperProps={{ sx: { minWidth: 220, mt: 1 } }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user.email}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleLogout} data-testid="logout-menu-item">
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography variant="body2" color="error.main">
                    {tAuth('logout')}
                  </Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                component={Link}
                href={`/${locale}/login`}
                variant="outlined"
                size="small"
                startIcon={<LoginIcon fontSize="small" />}
                data-testid="header-login-button"
              >
                {tAuth('loginButton')}
              </Button>
              <Button
                component={Link}
                href={`/${locale}/register`}
                variant="contained"
                size="small"
                startIcon={<PersonAddAltIcon fontSize="small" />}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                {tAuth('createAccountLink')}
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
