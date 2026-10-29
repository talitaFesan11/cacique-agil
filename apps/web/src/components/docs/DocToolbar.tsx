import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import CodeIcon from '@mui/icons-material/Code';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TableChartIcon from '@mui/icons-material/TableChart';
import HighlightIcon from '@mui/icons-material/Highlight';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import AddTaskIcon from '@mui/icons-material/AddTask';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface DocToolbarProps {
  editor: Editor | null;
}

export const DocToolbar: React.FC<DocToolbarProps> = ({ editor }) => {
  const [headingAnchor, setHeadingAnchor] = useState<null | HTMLElement>(null);
  const [tableAnchor, setTableAnchor] = useState<null | HTMLElement>(null);
  const [calloutAnchor, setCalloutAnchor] = useState<null | HTMLElement>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskKey, setTaskKey] = useState('FLX-1');
  const [taskTitle, setTaskTitle] = useState('Implementar documentação colaborativa');

  if (!editor) return null;

  const handleInsertEmbeddedTask = () => {
    editor
      .chain()
      .focus()
      // @ts-expect-error custom extension command
      .setEmbeddedTask({
        taskId: 'demo-task-id',
        taskKey: taskKey || 'FLX-1',
        title: taskTitle || 'Tarefa Selecionada',
        statusName: 'A Fazer',
        statusCategory: 'TODO',
        priority: 'HIGH',
      })
      .run();
    setTaskModalOpen(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.5,
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Níveis de Título */}
      <Button
        size="small"
        variant="text"
        color="inherit"
        endIcon={<ArrowDropDownIcon />}
        onClick={(e) => setHeadingAnchor(e.currentTarget)}
        sx={{ textTransform: 'none', fontWeight: 600, minWidth: 100 }}
      >
        {editor.isActive('heading', { level: 1 })
          ? 'Título 1'
          : editor.isActive('heading', { level: 2 })
            ? 'Título 2'
            : editor.isActive('heading', { level: 3 })
              ? 'Título 3'
              : 'Normal'}
      </Button>

      <Menu
        anchorEl={headingAnchor}
        open={Boolean(headingAnchor)}
        onClose={() => setHeadingAnchor(null)}
      >
        <MenuItem
          selected={editor.isActive('paragraph')}
          onClick={() => {
            editor.chain().focus().setParagraph().run();
            setHeadingAnchor(null);
          }}
        >
          Texto Normal
        </MenuItem>
        <MenuItem
          selected={editor.isActive('heading', { level: 1 })}
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            setHeadingAnchor(null);
          }}
        >
          Título 1 (H1)
        </MenuItem>
        <MenuItem
          selected={editor.isActive('heading', { level: 2 })}
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            setHeadingAnchor(null);
          }}
        >
          Título 2 (H2)
        </MenuItem>
        <MenuItem
          selected={editor.isActive('heading', { level: 3 })}
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
            setHeadingAnchor(null);
          }}
        >
          Título 3 (H3)
        </MenuItem>
      </Menu>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Formatação Básica */}
      <Tooltip title="Negrito (Ctrl+B)">
        <IconButton
          size="small"
          color={editor.isActive('bold') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FormatBoldIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Itálico (Ctrl+I)">
        <IconButton
          size="small"
          color={editor.isActive('italic') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FormatItalicIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Tachado">
        <IconButton
          size="small"
          color={editor.isActive('strike') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikethroughSIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Código Inline">
        <IconButton
          size="small"
          color={editor.isActive('code') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <CodeIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Realce / Destaque">
        <IconButton
          size="small"
          color={editor.isActive('highlight') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <HighlightIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Listas e Tarefas */}
      <Tooltip title="Lista com Marcadores">
        <IconButton
          size="small"
          color={editor.isActive('bulletList') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FormatListBulletedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Lista Numerada">
        <IconButton
          size="small"
          color={editor.isActive('orderedList') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FormatListNumberedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Checklist / Tarefas">
        <IconButton
          size="small"
          color={editor.isActive('taskList') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckBoxOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Tabelas */}
      <Tooltip title="Tabelas">
        <IconButton
          size="small"
          color={editor.isActive('table') ? 'primary' : 'default'}
          onClick={(e) => setTableAnchor(e.currentTarget)}
        >
          <TableChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={tableAnchor}
        open={Boolean(tableAnchor)}
        onClose={() => setTableAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
            setTableAnchor(null);
          }}
        >
          Inserir Tabela 3x3
        </MenuItem>
        <MenuItem
          disabled={!editor.isActive('table')}
          onClick={() => {
            editor.chain().focus().addRowAfter().run();
            setTableAnchor(null);
          }}
        >
          Adicionar Linha Abaixo
        </MenuItem>
        <MenuItem
          disabled={!editor.isActive('table')}
          onClick={() => {
            editor.chain().focus().addColumnAfter().run();
            setTableAnchor(null);
          }}
        >
          Adicionar Coluna à Direita
        </MenuItem>
        <MenuItem
          disabled={!editor.isActive('table')}
          onClick={() => {
            editor.chain().focus().deleteRow().run();
            setTableAnchor(null);
          }}
        >
          Excluir Linha
        </MenuItem>
        <MenuItem
          disabled={!editor.isActive('table')}
          onClick={() => {
            editor.chain().focus().deleteColumn().run();
            setTableAnchor(null);
          }}
        >
          Excluir Coluna
        </MenuItem>
        <MenuItem
          disabled={!editor.isActive('table')}
          onClick={() => {
            editor.chain().focus().deleteTable().run();
            setTableAnchor(null);
          }}
        >
          Excluir Tabela Inteira
        </MenuItem>
      </Menu>

      {/* Callouts */}
      <Tooltip title="Caixa de Destaque / Callout">
        <IconButton
          size="small"
          color={editor.isActive('callout') ? 'primary' : 'default'}
          onClick={(e) => setCalloutAnchor(e.currentTarget)}
        >
          <NotificationImportantIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={calloutAnchor}
        open={Boolean(calloutAnchor)}
        onClose={() => setCalloutAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleCallout({ variant: 'info' }).run();
            setCalloutAnchor(null);
          }}
        >
          ℹ️ Informação (Azul)
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleCallout({ variant: 'success' }).run();
            setCalloutAnchor(null);
          }}
        >
          ✅ Sucesso (Verde)
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleCallout({ variant: 'warning' }).run();
            setCalloutAnchor(null);
          }}
        >
          ⚠️ Aviso (Amarelo)
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleCallout({ variant: 'danger' }).run();
            setCalloutAnchor(null);
          }}
        >
          🚨 Perigo (Vermelho)
        </MenuItem>
      </Menu>

      {/* Citação & Divisor */}
      <Tooltip title="Citação em Bloco">
        <IconButton
          size="small"
          color={editor.isActive('blockquote') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <FormatQuoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Divisor Horizontal">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <HorizontalRuleIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Bloco de Tarefa Embutida */}
      <Tooltip title="Embutir Bloco de Tarefa Viva">
        <IconButton
          data-testid="embed-task-button"
          size="small"
          color="primary"
          onClick={() => setTaskModalOpen(true)}
        >
          <AddTaskIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box sx={{ flex: 1 }} />

      {/* Desfazer / Refazer */}
      <Tooltip title="Desfazer (Ctrl+Z)">
        <span>
          <IconButton
            size="small"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Refazer (Ctrl+Y)">
        <span>
          <IconButton
            size="small"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* Diálogo para embutir tarefa */}
      <Dialog
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Embutir Tarefa no Documento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Chave da Tarefa (ex: FLX-1)"
            value={taskKey}
            onChange={(e) => setTaskKey(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Título da Tarefa"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskModalOpen(false)}>Cancelar</Button>
          <Button data-testid="confirm-embed-task-button" variant="contained" onClick={handleInsertEmbeddedTask}>
            Embutir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
