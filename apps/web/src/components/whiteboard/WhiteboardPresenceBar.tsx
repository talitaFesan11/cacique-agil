'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import { RealtimeUserPresence } from '@fluxo/shared';
import { WhiteboardProviderStatus } from '@/lib/whiteboard-yjs-provider';

interface WhiteboardPresenceBarProps {
  status: WhiteboardProviderStatus;
  activeUsers: RealtimeUserPresence[];
}

export const WhiteboardPresenceBar: React.FC<WhiteboardPresenceBarProps> = ({
  status,
  activeUsers,
}) => {
  const getStatusChip = () => {
    switch (status) {
      case 'connected':
        return (
          <Tooltip title="Sincronização em tempo real ativa (CRDT Yjs)">
            <Chip
              icon={<WifiIcon sx={{ fontSize: '14px !important', color: '#16a34a !important' }} />}
              label="Conectado"
              size="small"
              sx={{
                height: 24,
                fontSize: '11px',
                fontWeight: 600,
                bgcolor: 'rgba(22, 163, 74, 0.1)',
                color: '#16a34a',
                border: '1px solid rgba(22, 163, 74, 0.2)',
              }}
            />
          </Tooltip>
        );
      case 'connecting':
        return (
          <Tooltip title="Conectando ao canal em tempo real...">
            <Chip
              icon={<SyncIcon sx={{ fontSize: '14px !important', animation: 'spin 1s linear infinite' }} />}
              label="Sincronizando"
              size="small"
              sx={{
                height: 24,
                fontSize: '11px',
                fontWeight: 600,
                bgcolor: 'rgba(234, 88, 12, 0.1)',
                color: '#ea580c',
                border: '1px solid rgba(234, 88, 12, 0.2)',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          </Tooltip>
        );
      default:
        return (
          <Tooltip title="Desconectado do servidor">
            <Chip
              icon={<WifiOffIcon sx={{ fontSize: '14px !important', color: '#dc2626 !important' }} />}
              label="Offline"
              size="small"
              sx={{
                height: 24,
                fontSize: '11px',
                fontWeight: 600,
                bgcolor: 'rgba(220, 38, 38, 0.1)',
                color: '#dc2626',
                border: '1px solid rgba(220, 38, 38, 0.2)',
              }}
            />
          </Tooltip>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {getStatusChip()}

      {activeUsers.length > 0 && (
        <AvatarGroup
          max={4}
          sx={{
            '& .MuiAvatar-root': {
              width: 26,
              height: 26,
              fontSize: '11px',
              border: '2px solid #ffffff',
            },
          }}
        >
          {activeUsers.map((u) => (
            <Tooltip key={u.userId} title={`${u.name} (editando)`}>
              <Avatar
                src={u.avatarUrl || undefined}
                alt={u.name}
                sx={{
                  bgcolor: stringToColor(u.name),
                }}
              >
                {u.name.slice(0, 2).toUpperCase()}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      )}
    </Box>
  );
};

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
  return colors[Math.abs(hash) % colors.length] || '#6366f1';
}
