'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <AppHeader onToggleSidebar={handleToggleSidebar} />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <AppSidebar
          open={sidebarOpen}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: { xs: 2, md: 4 },
            backgroundColor: 'background.default',
            color: 'text.primary',
            minHeight: 'calc(100vh - 64px)',
            transition: 'margin 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
