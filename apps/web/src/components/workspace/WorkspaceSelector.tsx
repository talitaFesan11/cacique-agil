'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth-store';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';

export function WorkspaceSelector() {
  const t = useTranslations('workspace');
  const locale = useLocale();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useAuthStore((s) => s.setActiveWorkspaceId);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createOpen, setCreateOpen] = useState(false);

  if (!user) {
    return null;
  }

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId || w.slug === activeWorkspaceId) ||
    workspaces[0] ||
    null;

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    handleCloseMenu();
  };

  const handleOpenSettings = () => {
    handleCloseMenu();
    if (activeWorkspace) {
      router.push(`/${locale}/workspaces/${activeWorkspace.slug}/settings`);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenMenu}
        variant="outlined"
        size="small"
        aria-label={t('selectorLabel')}
        data-testid="workspace-selector-button"
        endIcon={<UnfoldMoreIcon fontSize="small" />}
        sx={{
          textTransform: 'none',
          borderColor: 'divider',
          color: 'text.primary',
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Avatar
          sx={{
            width: 24,
            height: 24,
            fontSize: '0.75rem',
            fontWeight: 700,
            bgcolor: 'primary.main',
          }}
        >
          {activeWorkspace ? activeWorkspace.name.charAt(0).toUpperCase() : 'W'}
        </Avatar>
        <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {activeWorkspace ? activeWorkspace.name : t('newWorkspace')}
          </Typography>
        </Box>
        {activeWorkspace?.role && (
          <Chip
            label={activeWorkspace.role}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
          />
        )}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: { minWidth: 260, mt: 1 },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {t('switchWorkspace').toUpperCase()}
          </Typography>
        </Box>

        {workspaces.map((ws) => {
          const isSelected = activeWorkspace?.id === ws.id;
          return (
            <MenuItem
              key={ws.id}
              selected={isSelected}
              onClick={() => handleSelectWorkspace(ws.id)}
              data-testid={`workspace-option-${ws.slug}`}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {isSelected ? <CheckIcon fontSize="small" color="primary" /> : null}
              </ListItemIcon>
              <ListItemText
                primary={ws.name}
                secondary={ws.slug}
                primaryTypographyProps={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.875rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
              {ws.role && (
                <Chip
                  label={ws.role}
                  size="small"
                  sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                />
              )}
            </MenuItem>
          );
        })}

        <Divider sx={{ my: 1 }} />

        {activeWorkspace && (
          <MenuItem onClick={handleOpenSettings} data-testid="workspace-settings-menu-item">
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('manageMembers')} />
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setCreateOpen(true);
          }}
          data-testid="create-workspace-menu-item"
        >
          <ListItemIcon>
            <AddCircleOutlineIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={t('newWorkspace')}
            primaryTypographyProps={{ color: 'primary.main', fontWeight: 600 }}
          />
        </MenuItem>
      </Menu>

      <CreateWorkspaceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(slug) => {
          router.push(`/${locale}/workspaces/${slug}/settings`);
        }}
      />
    </>
  );
}
