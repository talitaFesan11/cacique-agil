import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentDto, PredefinedTemplateDto, RealtimeUserPresence } from '@fluxo/shared';
import { documentsApi } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';
import { ProviderStatus, YjsSocketProvider } from '@/lib/yjs-socket-provider';
import { CalloutExtension } from './extensions/CalloutExtension';
import { EmbeddedTaskExtension } from './extensions/EmbeddedTaskExtension';
import { DocToolbar } from './DocToolbar';
import { DocBubbleMenu } from './DocBubbleMenu';
import { DocCollaborationBar } from './DocCollaborationBar';
import { DocVersionHistoryDrawer } from './DocVersionHistoryDrawer';
import { DocInlineCommentsPane } from './DocInlineCommentsPane';
import { DocTemplatesDialog } from './DocTemplatesDialog';
import { DocExportDialog } from './DocExportDialog';
import styles from './docs.module.css';

interface DocEditorProps {
  document: DocumentDto;
  onTitleChange?: (newTitle: string) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

const EMOJI_OPTIONS = ['📄', '🚀', '📝', '🎨', '📊', '📋', '💡', '🎯', '⚙️', '🔍', '📌', '✨'];

const getUserColor = (name: string): string => {
  const colors = [
    '#6366f1',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#8b5cf6',
    '#f97316',
    '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] || '#6366f1';
};

export const DocEditor: React.FC<DocEditorProps> = ({
  document: doc,
  onTitleChange,
  onToggleSidebar,
  sidebarOpen,
}) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [title, setTitle] = useState(doc.title);
  const [icon, setIcon] = useState(doc.icon || '📄');
  const [isFavorite, setIsFavorite] = useState(doc.isFavorite);
  const [emojiAnchor, setEmojiAnchor] = useState<null | HTMLElement>(null);

  const [versionsOpen, setVersionsOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [syncStatus, setSyncStatus] = useState<ProviderStatus>('connecting');
  const [activeUsers, setActiveUsers] = useState<RealtimeUserPresence[]>([]);

  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Instancia Provedor Yjs sobre Socket.IO
  const provider = useMemo(() => {
    return new YjsSocketProvider(doc.id);
  }, [doc.id]);

  useEffect(() => {
    setTitle(doc.title);
    setIcon(doc.icon || '📄');
    setIsFavorite(doc.isFavorite);
  }, [doc.id, doc.title, doc.icon, doc.isFavorite]);

  useEffect(() => {
    const unsub = provider.onStatusChange((status) => {
      setSyncStatus(status);
    });
    const unsubPresence = provider.onPresenceChange((users) => {
      setActiveUsers(users);
    });

    return () => {
      unsub();
      unsubPresence();
      provider.destroy();
    };
  }, [provider]);

  // Consultas de Versões e Comentários
  const { data: versions = [], refetch: refetchVersions } = useQuery({
    queryKey: ['doc-versions', doc.id],
    queryFn: () => documentsApi.getVersions(doc.id),
    enabled: versionsOpen,
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['doc-comments', doc.id],
    queryFn: () => documentsApi.getComments(doc.id),
    enabled: commentsOpen,
  });

  const { data: templates = { predefined: [], custom: [] } } = useQuery({
    queryKey: ['doc-templates', doc.workspaceId],
    queryFn: () => documentsApi.getTemplates(doc.workspaceId),
    enabled: templatesOpen,
  });

  // Editor TipTap
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Desativa history interno para delegar ao CRDT Yjs
      }),
      Collaboration.configure({
        document: provider.doc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: currentUser?.name || 'Anônimo',
          color: getUserColor(currentUser?.name || 'User'),
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: "Pressione '/' para comandos ou comece a digitar...",
      }),
      CalloutExtension,
      EmbeddedTaskExtension,
    ],
    editorProps: {
      attributes: {
        class: 'cacique-doc-editor',
      },
    },
    immediatelyRender: false,
  });

  // Inicializa o conteúdo do documento caso o CRDT Yjs esteja vazio
  useEffect(() => {
    if (editor && editor.isEmpty && doc.contentJson) {
      editor.commands.setContent(doc.contentJson);
    }
  }, [editor, doc.contentJson]);

  // Atualização de título com debounce
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (onTitleChange) onTitleChange(newTitle);

    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(async () => {
      try {
        await documentsApi.update(doc.id, { title: newTitle });
        queryClient.invalidateQueries({ queryKey: ['doc-tree', doc.workspaceId] });
      } catch (err) {
        console.error('Erro ao salvar título:', err);
      }
    }, 800);
  };

  const handleSelectEmoji = async (chosenEmoji: string) => {
    setIcon(chosenEmoji);
    setEmojiAnchor(null);
    try {
      await documentsApi.update(doc.id, { icon: chosenEmoji });
      queryClient.invalidateQueries({ queryKey: ['doc-tree', doc.workspaceId] });
    } catch (err) {
      console.error('Erro ao salvar ícone:', err);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const res = await documentsApi.toggleFavorite(doc.id);
      setIsFavorite(res.isFavorite);
      queryClient.invalidateQueries({ queryKey: ['doc-tree', doc.workspaceId] });
    } catch (err) {
      console.error('Erro ao alternar favorito:', err);
    }
  };

  const handleCreateVersion = async (name: string) => {
    try {
      await documentsApi.createVersion(doc.id, name);
      refetchVersions();
    } catch (err) {
      console.error('Erro ao criar versão:', err);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const res = await documentsApi.restoreVersion(doc.id, versionId);
      if (editor && res.document.contentJson) {
        editor.commands.setContent(res.document.contentJson);
      }
      refetchVersions();
    } catch (err) {
      console.error('Erro ao restaurar versão:', err);
    }
  };

  const handleAddComment = async (text: string, selectedText?: string) => {
    try {
      await documentsApi.createComment(doc.id, { body: { text }, selectedText });
      refetchComments();
    } catch (err) {
      console.error('Erro ao criar comentário:', err);
    }
  };

  const handleToggleResolveComment = async (commentId: string, currentResolved: boolean) => {
    try {
      await documentsApi.updateComment(commentId, { resolved: !currentResolved });
      refetchComments();
    } catch (err) {
      console.error('Erro ao resolver comentário:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await documentsApi.deleteComment(commentId);
      refetchComments();
    } catch (err) {
      console.error('Erro ao excluir comentário:', err);
    }
  };

  const handleSelectTemplate = (template: PredefinedTemplateDto) => {
    if (editor && template.contentJson) {
      editor.commands.setContent(template.contentJson);
    }
    if (template.icon) {
      handleSelectEmoji(template.icon);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Barra de Colaboração Superior */}
      <DocCollaborationBar
        title={title}
        icon={icon}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        syncStatus={syncStatus}
        activeUsers={activeUsers}
        onOpenVersions={() => setVersionsOpen(true)}
        onOpenComments={() => setCommentsOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onToggleSidebar={onToggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      {/* Barra de Ferramentas de Formatação */}
      <DocToolbar editor={editor} />

      {/* Menu Flutuante ao Selecionar Texto */}
      <DocBubbleMenu editor={editor} />

      {/* Área Principal de Rolagem do Documento */}
      <Box className={styles.editorScrollArea}>
        <Box className={styles.editorContainer}>
          {/* Cabeçalho do Documento: Ícone e Título Grande */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              size="large"
              onClick={(e) => setEmojiAnchor(e.currentTarget)}
              sx={{
                fontSize: '2.5rem',
                p: 1,
                borderRadius: 2,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {icon}
            </IconButton>

            <TextField
              data-testid="doc-title-input"
              variant="standard"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Sem título"
              fullWidth
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: { xs: '1.8rem', sm: '2.4rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                },
              }}
            />
          </Box>

          {/* Editor TipTap */}
          <EditorContent editor={editor} />
        </Box>
      </Box>

      {/* Popover Seletor de Emoji */}
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.5, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {EMOJI_OPTIONS.map((e) => (
            <IconButton
              key={e}
              onClick={() => handleSelectEmoji(e)}
              sx={{ fontSize: '1.5rem', p: 1 }}
            >
              {e}
            </IconButton>
          ))}
        </Box>
      </Popover>

      {/* Painel de Histórico de Versões */}
      <DocVersionHistoryDrawer
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        versions={versions}
        onCreateVersion={handleCreateVersion}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Painel de Comentários Inline */}
      <DocInlineCommentsPane
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        comments={comments}
        onAddComment={handleAddComment}
        onToggleResolve={handleToggleResolveComment}
        onDeleteComment={handleDeleteComment}
        selectedText={
          editor && !editor.state.selection.empty
            ? editor.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to,
                ' ',
              )
            : undefined
        }
      />

      {/* Diálogo de Modelos */}
      <DocTemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        templates={templates}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Diálogo de Exportação */}
      <DocExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        docId={doc.id}
        docTitle={title}
      />
    </Box>
  );
};
