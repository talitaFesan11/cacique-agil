import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import HistoryIcon from '@mui/icons-material/History';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import IosShareIcon from '@mui/icons-material/IosShare';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SyncIcon from '@mui/icons-material/Sync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import MenuIcon from '@mui/icons-material/Menu';
import { RealtimeUserPresence } from '@fluxo/shared';

interface DocCollaborationBarProps {
  title: string;
  icon?: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  syncStatus: 'connecting' | 'connected' | 'disconnected' | 'saving';
  activeUsers: RealtimeUserPresence[];
  onOpenVersions: () => void;
  onOpenComments: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const DocCollaborationBar: React.FC<DocCollaborationBarProps> = ({
  title,
  icon,
  isFavorite,
  onToggleFavorite,
  syncStatus,
  activeUsers,
  onOpenVersions,
  onOpenComments,
  onOpenTemplates,
  onOpenExport,
  onToggleSidebar,
  sidebarOpen,
}) => {
  // Deduplica usuários para evitar chaves duplicadas no AvatarGroup
  const uniqueUsers = React.useMemo(() => {
    const map = new Map<string, RealtimeUserPresence>();
    activeUsers.forEach((u, i) => {
      const key = u?.userId || `user-${i}`;
      if (!map.has(key)) {
        map.set(key, u);
      }
    });
    return Array.from(map.values());
  }, [activeUsers]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        {onToggleSidebar && (
          <IconButton size="small" onClick={onToggleSidebar} title="Alternar barra lateral">
            <MenuIcon fontSize="small" color={sidebarOpen ? 'primary' : 'inherit'} />
          </IconButton>
        )}

        <Typography sx={{ fontSize: '1.25rem', userSelect: 'none' }}>
          {icon || '📄'}
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 320,
          }}
        >
          {title || 'Documento'}
        </Typography>

        <Tooltip title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
          <IconButton
            data-testid="toggle-doc-favorite-bar"
            size="small"
            onClick={onToggleFavorite}
            color={isFavorite ? 'warning' : 'default'}
          >
            {isFavorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Status de Sincronização */}
        <Chip
          size="small"
          icon={
            syncStatus === 'connected' ? (
              <CloudDoneIcon fontSize="small" sx={{ color: 'success.main' }} />
            ) : syncStatus === 'saving' || syncStatus === 'connecting' ? (
              <SyncIcon fontSize="small" sx={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <CloudOffIcon fontSize="small" sx={{ color: 'error.main' }} />
            )
          }
          label={
            syncStatus === 'connected'
              ? 'Sincronizado'
              : syncStatus === 'saving'
                ? 'Salvando...'
                : syncStatus === 'connecting'
                  ? 'Conectando...'
                  : 'Offline'
          }
          variant="outlined"
          sx={{
            fontSize: '0.72rem',
            height: 24,
            borderColor:
              syncStatus === 'connected'
                ? 'success.light'
                : syncStatus === 'disconnected'
                  ? 'error.light'
                  : 'divider',
          }}
        />
      </Box>

      {/* Ações e Usuários Ativos */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Avatares dos Colaboradores Conectados */}
        {uniqueUsers.length > 0 && (
          <AvatarGroup
            max={4}
            sx={{
              '& .MuiAvatar-root': {
                width: 28,
                height: 28,
                fontSize: '0.75rem',
                border: '2px solid #fff',
              },
            }}
          >
            {uniqueUsers.map((u, index) => (
              <Tooltip key={u.userId || `presence-${index}`} title={`${u.name || 'Usuário'} (editando agora)`}>
                <Avatar
                  alt={u.name || 'Usuário'}
                  src={u.avatarUrl || undefined}
                  sx={{ bgcolor: '#6366f1' }}
                >
                  {(u.name || 'U').charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        )}

        <Button
          data-testid="open-templates-button"
          size="small"
          startIcon={<AutoAwesomeIcon />}
          onClick={onOpenTemplates}
          sx={{ textTransform: 'none', fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
        >
          Modelos
        </Button>

        <Tooltip title="Histórico de Versões">
          <IconButton data-testid="open-versions-button" size="small" onClick={onOpenVersions}>
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Comentários no Documento">
          <IconButton data-testid="open-comments-button" size="small" onClick={onOpenComments}>
            <ChatBubbleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Exportar (Markdown / PDF)">
          <IconButton data-testid="open-export-button" size="small" onClick={onOpenExport}>
            <IosShareIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
