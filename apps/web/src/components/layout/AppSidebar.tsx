'use client';

import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TimelineIcon from '@mui/icons-material/Timeline';
import DescriptionIcon from '@mui/icons-material/Description';
import GestureIcon from '@mui/icons-material/Gesture';
import FlagIcon from '@mui/icons-material/Flag';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth-store';

const DRAWER_WIDTH = 240;

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  mobileOpen: boolean;
}

export function AppSidebar({ open, onClose, mobileOpen }: AppSidebarProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId || w.slug === activeWorkspaceId) ||
    workspaces[0];

  const settingsHref = activeWorkspace
    ? `/${locale}/workspaces/${activeWorkspace.slug}/settings`
    : `/${locale}/login`;

  const navItems = [
    { key: 'dashboard', label: t('dashboard'), icon: <DashboardIcon />, href: `/${locale}` },
    {
      key: 'projects',
      label: t('projects'),
      icon: <FolderIcon />,
      href: `/${locale}/projects`,
    },
    {
      key: 'tasks',
      label: t('tasks'),
      icon: <CheckCircleOutlineIcon />,
      href: `/${locale}/projects`,
    },
    {
      key: 'kanban',
      label: t('kanban'),
      icon: <ViewKanbanIcon />,
      href: `/${locale}/projects`,
    },
    { key: 'timeline', label: t('timeline'), icon: <TimelineIcon />, href: `/${locale}` },
    { key: 'docs', label: t('docs'), icon: <DescriptionIcon />, href: `/${locale}/docs` },
    { key: 'whiteboards', label: t('whiteboards'), icon: <GestureIcon />, href: `/${locale}` },
    { key: 'goals', label: t('goals'), icon: <FlagIcon />, href: `/${locale}` },
    { key: 'reports', label: t('reports'), icon: <BarChartIcon />, href: `/${locale}` },
    {
      key: 'settings',
      label: t('settings'),
      icon: <SettingsIcon />,
      href: settingsHref,
    },
  ];

  const drawerContent = (
    <Box sx={{ overflow: 'auto', pt: 2 }}>
      <List>
        {navItems.map((item) => {
          const isSelected =
            item.key === 'settings'
              ? pathname?.includes('/settings')
              : item.key === 'projects'
                ? pathname?.includes('/projects')
                : item.key === 'docs'
                  ? pathname?.includes('/docs')
                  : item.key === 'dashboard' && pathname === `/${locale}`;

          return (
            <ListItem key={item.key} disablePadding>
              <ListItemButton
                data-testid={`nav-item-${item.key}`}
                selected={Boolean(isSelected)}
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: 40, color: isSelected ? 'primary.main' : 'text.secondary' }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Drawer Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer Desktop */}
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
            top: 64, // altura do AppHeader
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
