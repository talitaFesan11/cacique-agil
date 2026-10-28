'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { RealtimeUserPresence } from '@fluxo/shared';

interface PresenceBarProps {
  isConnected: boolean;
  activeUsers: RealtimeUserPresence[];
}

export const PresenceBar: React.FC<PresenceBarProps> = ({ isConnected, activeUsers }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
      data-testid="presence-bar"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: isConnected ? 'success.main' : 'text.disabled',
            boxShadow: isConnected ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
            animation: isConnected ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(0.95)', opacity: 0.8 },
              '50%': { transform: 'scale(1.2)', opacity: 1 },
              '100%': { transform: 'scale(0.95)', opacity: 0.8 },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            display: { xs: 'none', sm: 'inline' },
          }}
        >
          {isConnected ? 'Ao vivo' : 'Conectando...'}
        </Typography>
      </Box>

      {activeUsers.length > 0 && (
        <AvatarGroup
          max={4}
          sx={{
            '& .MuiAvatar-root': {
              width: 26,
              height: 26,
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '2px solid',
              borderColor: 'background.paper',
            },
          }}
        >
          {activeUsers.map((user) => (
            <Tooltip
              key={user.userId}
              title={`${user.name} (online agora)`}
              arrow
            >
              <Avatar
                alt={user.name}
                src={user.avatarUrl || undefined}
                sx={{
                  bgcolor: stringToColor(user.name),
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      )}
    </Box>
  );
};

function stringToColor(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#2563EB',
    '#7C3AED',
    '#DB2777',
    '#059669',
    '#D97706',
    '#DC2626',
    '#0891B2',
  ];
  return colors[Math.abs(hash) % colors.length];
}
