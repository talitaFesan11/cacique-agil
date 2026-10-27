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
import { useTranslations } from 'next-intl';

const DRAWER_WIDTH = 240;

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  mobileOpen: boolean;
}

export function AppSidebar({ open, onClose, mobileOpen }: AppSidebarProps) {
  const t = useTranslations('nav');

  const navItems = [
    { key: 'dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
    { key: 'projects', label: t('projects'), icon: <FolderIcon /> },
    { key: 'tasks', label: t('tasks'), icon: <CheckCircleOutlineIcon /> },
    { key: 'kanban', label: t('kanban'), icon: <ViewKanbanIcon /> },
    { key: 'timeline', label: t('timeline'), icon: <TimelineIcon /> },
    { key: 'docs', label: t('docs'), icon: <DescriptionIcon /> },
    { key: 'whiteboards', label: t('whiteboards'), icon: <GestureIcon /> },
    { key: 'goals', label: t('goals'), icon: <FlagIcon /> },
    { key: 'reports', label: t('reports'), icon: <BarChartIcon /> },
    { key: 'settings', label: t('settings'), icon: <SettingsIcon /> },
  ];

  const drawerContent = (
    <Box sx={{ overflow: 'auto', pt: 2 }}>
      <List>
        {navItems.map((item, index) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton selected={index === 0}>
              <ListItemIcon sx={{ minWidth: 40, color: index === 0 ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: index === 0 ? 600 : 400,
                  color: index === 0 ? 'primary.main' : 'inherit',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
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
