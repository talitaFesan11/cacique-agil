import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { DocumentTreeNodeDto } from '@fluxo/shared';
import { DocTreeNode } from './DocTreeNode';

interface DocTreeSidebarProps {
  tree: DocumentTreeNodeDto[];
  selectedDocId?: string | null;
  onSelectDoc: (docId: string) => void;
  onCreateDoc: (parentId?: string | null) => void;
  onToggleFavorite: (docId: string) => void;
  onRenameDoc: (docId: string, newTitle: string) => void;
  onDeleteDoc: (docId: string) => void;
  onOpenTemplates: () => void;
}

export const DocTreeSidebar: React.FC<DocTreeSidebarProps> = ({
  tree,
  selectedDocId,
  onSelectDoc,
  onCreateDoc,
  onToggleFavorite,
  onRenameDoc,
  onDeleteDoc,
  onOpenTemplates,
}) => {
  const [search, setSearch] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleteDocTitle, setDeleteDocTitle] = useState('');

  // Coleta documentos favoritos de toda a árvore
  const getFavorites = (nodes: DocumentTreeNodeDto[]): DocumentTreeNodeDto[] => {
    let favs: DocumentTreeNodeDto[] = [];
    nodes.forEach((n) => {
      if (n.isFavorite) favs.push(n);
      if (n.children && n.children.length > 0) {
        favs = favs.concat(getFavorites(n.children));
      }
    });
    return favs;
  };

  const favoriteDocs = getFavorites(tree);

  // Filtra nós pela busca
  const filterTree = (nodes: DocumentTreeNodeDto[]): DocumentTreeNodeDto[] => {
    if (!search.trim()) return nodes;
    const term = search.toLowerCase();

    return nodes
      .map((node) => {
        const matchesTitle = node.title.toLowerCase().includes(term);
        const filteredChildren = filterTree(node.children || []);
        if (matchesTitle || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
        return null;
      })
      .filter((n): n is DocumentTreeNodeDto => n !== null);
  };

  const filteredTree = filterTree(tree);

  const handleStartRename = (docId: string, currentTitle: string) => {
    setRenameDocId(docId);
    setNewTitle(currentTitle);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = () => {
    if (renameDocId && newTitle.trim()) {
      onRenameDoc(renameDocId, newTitle.trim());
    }
    setRenameDialogOpen(false);
  };

  const handleStartDelete = (docId: string, title: string) => {
    setDeleteDocId(docId);
    setDeleteDocTitle(title);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteDocId) {
      onDeleteDoc(deleteDocId);
    }
    setDeleteConfirmOpen(false);
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Cabeçalho da Barra Lateral */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Documentos
            </Typography>
          </Box>

          <Button
            data-testid="create-doc-root-button"
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onCreateDoc(null)}
            sx={{ textTransform: 'none', fontWeight: 600, py: 0.5, px: 1.5 }}
          >
            Nova Página
          </Button>
        </Box>

        {/* Campo de Busca */}
        <TextField
          data-testid="search-docs-input"
          size="small"
          placeholder="Buscar páginas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.default',
            },
          }}
        />
      </Box>

      {/* Lista de Páginas */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        {/* Seção de Favoritos */}
        {favoriteDocs.length > 0 && !search && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5 }}>
              <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}
              >
                Favoritos
              </Typography>
            </Box>

            {favoriteDocs.map((fav) => (
              <Box
                key={`fav-${fav.id}`}
                onClick={() => onSelectDoc(fav.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.6,
                  px: 1.5,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: selectedDocId === fav.id ? 'primary.50' : 'transparent',
                  color: selectedDocId === fav.id ? 'primary.main' : 'text.primary',
                  fontWeight: selectedDocId === fav.id ? 700 : 500,
                  '&:hover': {
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  },
                }}
              >
                <Typography sx={{ fontSize: '0.9rem' }}>{fav.icon || '📄'}</Typography>
                <Typography
                  variant="body2"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {fav.title}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Árvore Completa */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, py: 0.5, mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}
          >
            Páginas
          </Typography>
        </Box>

        {filteredTree.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              {search ? 'Nenhuma página encontrada' : 'Nenhuma página criada'}
            </Typography>
          </Box>
        ) : (
          filteredTree.map((node) => (
            <DocTreeNode
              key={node.id}
              node={node}
              level={0}
              selectedDocId={selectedDocId}
              onSelectDoc={onSelectDoc}
              onCreateSubpage={(parentId) => onCreateDoc(parentId)}
              onToggleFavorite={onToggleFavorite}
              onRename={handleStartRename}
              onDelete={handleStartDelete}
            />
          ))
        )}
      </Box>

      <Divider />

      {/* Rodapé da Barra Lateral: Modelos */}
      <Box sx={{ p: 1.5 }}>
        <Button
          data-testid="open-templates-sidebar-button"
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<AutoAwesomeIcon />}
          onClick={onOpenTemplates}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Modelos e Templates
        </Button>
      </Box>

      {/* Diálogo de Renomear */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Renomear Documento</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Título da Página"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmRename();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmRename}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Excluir Documento?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tem certeza de que deseja excluir &ldquo;{deleteDocTitle}&rdquo;? O documento será movido para a lixeira.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
