import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DocumentCommentDto } from '@fluxo/shared';

interface DocInlineCommentsPaneProps {
  open: boolean;
  onClose: () => void;
  comments: DocumentCommentDto[];
  loading?: boolean;
  onAddComment: (text: string, selectedText?: string) => void;
  onToggleResolve: (commentId: string, currentResolved: boolean) => void;
  onDeleteComment: (commentId: string) => void;
  selectedText?: string;
}

export const DocInlineCommentsPane: React.FC<DocInlineCommentsPaneProps> = ({
  open,
  onClose,
  comments,
  loading = false,
  onAddComment,
  onToggleResolve,
  onDeleteComment,
  selectedText,
}) => {
  const [newCommentText, setNewCommentText] = useState('');

  const handleSend = () => {
    if (newCommentText.trim()) {
      onAddComment(newCommentText.trim(), selectedText);
      setNewCommentText('');
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 380 }, p: 0 },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatBubbleOutlineIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Comentários ({comments.length})
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Input de Novo Comentário */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          {selectedText && (
            <Box
              sx={{
                mb: 1.5,
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'warning.50',
                borderLeft: '3px solid',
                borderColor: 'warning.main',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                Trecho Selecionado:
              </Typography>
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                &ldquo;{selectedText}&rdquo;
              </Typography>
            </Box>
          )}

          <TextField
            data-testid="comment-input"
            multiline
            rows={2}
            fullWidth
            size="small"
            placeholder="Deixe um comentário no documento..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSend();
              }
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              data-testid="send-comment-button"
              size="small"
              variant="contained"
              endIcon={<SendIcon />}
              disabled={!newCommentText.trim()}
              onClick={handleSend}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              Comentar
            </Button>
          </Box>
        </Box>

        {/* Lista de Comentários */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Carregando comentários...
            </Typography>
          ) : comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Nenhum comentário adicionado ainda. Selecione um trecho para comentar!
            </Typography>
          ) : (
            comments.map((c) => {
              const isResolved = Boolean(c.resolvedAt);
              return (
                <Box
                  key={c.id}
                  data-testid={`comment-item-${c.id}`}
                  sx={{
                    p: 1.5,
                    mb: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isResolved ? 'success.light' : 'divider',
                    bgcolor: isResolved
                      ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4')
                      : 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#6366f1' }}>
                        {c.author?.name ? c.author.name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {c.author?.name || 'Usuário'}
                      </Typography>
                    </Box>

                    {isResolved && (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                        label="Resolvido"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.68rem' }}
                      />
                    )}
                  </Box>

                  {/* Trecho selecionado */}
                  {c.selectedText && (
                    <Box
                      sx={{
                        mb: 1,
                        p: 0.75,
                        borderRadius: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                        borderLeft: '2px solid #cbd5e1',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        &ldquo;{c.selectedText}&rdquo;
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="body2" sx={{ my: 0.5 }}>
                    {typeof c.body === 'string'
                      ? c.body
                      : typeof c.body === 'object' && c.body !== null && 'text' in c.body
                        ? String((c.body as { text?: unknown }).text || '')
                        : JSON.stringify(c.body)}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Button
                        size="small"
                        color={isResolved ? 'inherit' : 'success'}
                        onClick={() => onToggleResolve(c.id, isResolved)}
                        sx={{ fontSize: '0.72rem', textTransform: 'none', py: 0.2 }}
                      >
                        {isResolved ? 'Reabrir' : 'Resolver'}
                      </Button>

                      <IconButton size="small" onClick={() => onDeleteComment(c.id)} sx={{ p: 0.5 }}>
                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
