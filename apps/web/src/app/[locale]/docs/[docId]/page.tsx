'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/auth-store';
import { documentsApi } from '@/lib/api-client';
import { DocTreeSidebar } from '@/components/docs/DocTreeSidebar';
import { DocEditor } from '@/components/docs/DocEditor';
import { DocTemplatesDialog } from '@/components/docs/DocTemplatesDialog';
import { PredefinedTemplateDto } from '@fluxo/shared';
import styles from '@/components/docs/docs.module.css';

export default function DocumentDetailPage() {
  const params = useParams<{ docId: string }>();
  const docId = String(params?.docId || '');
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();

  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId || w.slug === activeWorkspaceId) ||
    workspaces[0];

  const workspaceId = activeWorkspace?.id || '';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Consulta da árvore de documentos
  const { data: tree = [] } = useQuery({
    queryKey: ['doc-tree', workspaceId],
    queryFn: () => documentsApi.getTree(workspaceId),
    enabled: Boolean(workspaceId),
  });

  // Consulta do documento selecionado
  const {
    data: document,
    isLoading: docLoading,
    error: docError,
  } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => documentsApi.getById(docId),
    enabled: Boolean(docId),
  });

  const { data: templates = { predefined: [], custom: [] } } = useQuery({
    queryKey: ['doc-templates', workspaceId],
    queryFn: () => documentsApi.getTemplates(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const handleSelectDoc = (targetDocId: string) => {
    router.push(`/${locale}/docs/${targetDocId}`);
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

  const handleToggleFavorite = async (targetId: string) => {
    await documentsApi.toggleFavorite(targetId);
    queryClient.invalidateQueries({ queryKey: ['doc-tree', workspaceId] });
    if (targetId === docId) {
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
    }
  };

  const handleRenameDoc = async (targetId: string, newTitle: string) => {
    await documentsApi.update(targetId, { title: newTitle });
    queryClient.invalidateQueries({ queryKey: ['doc-tree', workspaceId] });
    if (targetId === docId) {
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
    }
  };

  const handleDeleteDoc = async (targetId: string) => {
    await documentsApi.delete(targetId);
    queryClient.invalidateQueries({ queryKey: ['doc-tree', workspaceId] });
    if (targetId === docId) {
      router.push(`/${locale}/docs`);
    }
  };

  if (docLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (docError || !document) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Documento não encontrado ou sem permissão de acesso.
        </Typography>
        <Button variant="contained" onClick={() => router.push(`/${locale}/docs`)}>
          Voltar para Documentos
        </Button>
      </Box>
    );
  }

  return (
    <Box className={styles.docLayout}>
      {/* Barra Lateral da Árvore */}
      {sidebarOpen && (
        <Box className={styles.sidebar}>
          <DocTreeSidebar
            tree={tree}
            selectedDocId={docId}
            onSelectDoc={handleSelectDoc}
            onCreateDoc={handleCreateDoc}
            onToggleFavorite={handleToggleFavorite}
            onRenameDoc={handleRenameDoc}
            onDeleteDoc={handleDeleteDoc}
            onOpenTemplates={() => setTemplatesOpen(true)}
          />
        </Box>
      )}

      {/* Editor do Documento */}
      <Box className={styles.mainContent}>
        <DocEditor
          document={document}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
      </Box>

      {/* Diálogo de Modelos */}
      <DocTemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        templates={templates}
        onSelectTemplate={handleSelectTemplate}
      />
    </Box>
  );
}
