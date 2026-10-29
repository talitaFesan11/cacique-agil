'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/auth-store';
import { documentsApi } from '@/lib/api-client';
import { DocTreeSidebar } from '@/components/docs/DocTreeSidebar';
import { DocTemplatesDialog } from '@/components/docs/DocTemplatesDialog';
import { PredefinedTemplateDto } from '@fluxo/shared';
import styles from '@/components/docs/docs.module.css';

export default function DocsIndexPage() {
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();

  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId || w.slug === activeWorkspaceId) ||
    workspaces[0];

  const workspaceId = activeWorkspace?.id || '';

  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Consulta da árvore de documentos
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['doc-tree', workspaceId],
    queryFn: () => documentsApi.getTree(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const { data: templates = { predefined: [], custom: [] } } = useQuery({
    queryKey: ['doc-templates', workspaceId],
    queryFn: () => documentsApi.getTemplates(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const handleSelectDoc = (docId: string) => {
    router.push(`/${locale}/docs/${docId}`);
  };

  const handleCreateDoc = async (parentId?: string | null) => {
    if (!workspaceId) return;
    try {
      const newDoc = await documentsApi.create({
        workspaceId,
        parentId: parentId || null,
        title: 'Sem título',
      });
      queryClient.invalidateQueries({ queryKey: ['doc-tree', workspaceId] });
      router.push(`/${locale}/docs/${newDoc.id}`);
    } catch (err) {
      console.error('Erro ao criar documento:', err);
    }
  };

  const handleSelectTemplate = async (template: PredefinedTemplateDto) => {
    if (!workspaceId) return;
    try {
      const newDoc = await documentsApi.create({
        workspaceId,
        templateId: template.id !== 'blank' ? template.id : undefined,
        title: template.title !== 'Documento em Branco' ? template.title : 'Sem título',
        icon: template.icon,
        contentJson: template.contentJson,
      });
      queryClient.invalidateQueries({ queryKey: ['doc-tree', workspaceId] });
      router.push(`/${locale}/docs/${newDoc.id}`);
    } catch (err) {
      console.error('Erro ao criar documento a partir de template:', err);
    }
  };

  const handleToggleFavorite = async (docId: string) => {
    await documentsApi.toggleFavorite(docId);
    queryClient.invalidateQueries({ queryKey: ['doc-tree', workspaceId] });
  };

  const handleRenameDoc = async (docId: string, newTitle: string) => {
    await documentsApi.update(docId, { title: newTitle });
    queryClient.invalidateQueries({ queryKey: ['doc-tree', workspaceId] });
  };

  const handleDeleteDoc = async (docId: string) => {
    await documentsApi.delete(docId);
    queryClient.invalidateQueries({ queryKey: ['doc-tree', workspaceId] });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={styles.docLayout}>
      {/* Barra Lateral da Árvore */}
      <Box className={styles.sidebar}>
        <DocTreeSidebar
          tree={tree}
          selectedDocId={null}
          onSelectDoc={handleSelectDoc}
          onCreateDoc={handleCreateDoc}
          onToggleFavorite={handleToggleFavorite}
          onRenameDoc={handleRenameDoc}
          onDeleteDoc={handleDeleteDoc}
          onOpenTemplates={() => setTemplatesOpen(true)}
        />
      </Box>

      {/* Conteúdo Principal: Estado Vazio ou Boas-Vindas */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'primary.50',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <DescriptionIcon sx={{ fontSize: 40 }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Wiki & Documentos Colaborativos
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mb: 4 }}>
          Crie notas de reuniões, especificações técnicas (PRDs), documentação viva interligada com tarefas e compartilhe conhecimento com toda a equipe.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => handleCreateDoc(null)}
            sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            Nova Página
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => setTemplatesOpen(true)}
            sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            Usar Modelo
          </Button>
        </Box>

        {/* Diálogo de Modelos */}
        <DocTemplatesDialog
          open={templatesOpen}
          onClose={() => setTemplatesOpen(false)}
          templates={templates}
          onSelectTemplate={handleSelectTemplate}
        />
      </Box>
    </Box>
  );
}
