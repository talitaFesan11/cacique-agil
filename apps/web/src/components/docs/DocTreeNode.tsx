import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { DocumentTreeNodeDto } from '@fluxo/shared';

interface DocTreeNodeProps {
  node: DocumentTreeNodeDto;
  level?: number;
  selectedDocId?: string | null;
  onSelectDoc: (docId: string) => void;
  onCreateSubpage: (parentId: string) => void;
  onToggleFavorite: (docId: string) => void;
  onRename: (docId: string, currentTitle: string) => void;
  onDelete: (docId: string, title: string) => void;
}

export const DocTreeNode: React.FC<DocTreeNodeProps> = ({
  node,
  level = 0,
  selectedDocId,
  onSelectDoc,
  onCreateSubpage,
  onToggleFavorite,
  onRename,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedDocId === node.id;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  return (
    <Box sx={{ width: '100%', userSelect: 'none' }}>
      <Box
        data-testid={`doc-tree-item-${node.id}`}
        onClick={() => onSelectDoc(node.id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          py: 0.75,
          px: 1,
          pl: 1 + level * 2,
          borderRadius: 1.5,
          cursor: 'pointer',
          bgcolor: isSelected
            ? (theme) => (theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.50')
            : 'transparent',
          color: isSelected ? 'primary.main' : 'text.primary',
          fontWeight: isSelected ? 700 : 500,
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: isSelected
              ? (theme) => (theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.100')
              : (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
            '& .tree-actions': {
              opacity: 1,
            },
          },
        }}
      >
        {/* Seta de Expandir/Recolher */}
        <Box
          onClick={handleToggleExpand}
          sx={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasChildren ? 'pointer' : 'default',
            visibility: hasChildren ? 'visible' : 'hidden',
          }}
        >
          {expanded ? (
            <ExpandMoreIcon sx={{ fontSize: 18 }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          )}
        </Box>

        {/* Ícone do Documento */}
        <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>
          {node.icon || '📄'}
        </Typography>

        {/* Título */}
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 'inherit',
          }}
        >
          {node.title}
        </Typography>

        {/* Ações Hover */}
        <Box
          className="tree-actions"
          sx={{
            display: 'flex',
            alignItems: 'center',
            opacity: { xs: 1, sm: isSelected ? 1 : 0 },
            transition: 'opacity 0.15s',
          }}
        >
          <IconButton
            size="small"
            title="Adicionar subpágina"
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubpage(node.id);
            }}
            sx={{ p: 0.5 }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>

          <IconButton size="small" onClick={handleOpenMenu} sx={{ p: 0.5 }}>
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Menu Contextual do Nó */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        PaperProps={{ sx: { minWidth: 160 } }}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onCreateSubpage(node.id);
          }}
        >
          <AddIcon fontSize="small" sx={{ mr: 1 }} /> Adicionar Subpágina
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onToggleFavorite(node.id);
          }}
        >
          {node.isFavorite ? (
            <>
              <StarIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} /> Desfavoritar
            </>
          ) : (
            <>
              <StarBorderIcon fontSize="small" sx={{ mr: 1 }} /> Favoritar
            </>
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onRename(node.id, node.title);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Renomear
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onDelete(node.id, node.title);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Excluir
        </MenuItem>
      </Menu>

      {/* Filhos Recursivos */}
      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {node.children.map((child) => (
              <DocTreeNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedDocId={selectedDocId}
                onSelectDoc={onSelectDoc}
                onCreateSubpage={onCreateSubpage}
                onToggleFavorite={onToggleFavorite}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};
