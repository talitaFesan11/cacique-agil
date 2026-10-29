import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import CodeIcon from '@mui/icons-material/Code';
import HighlightIcon from '@mui/icons-material/Highlight';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

interface DocBubbleMenuProps {
  editor: Editor | null;
}

export const DocBubbleMenu: React.FC<DocBubbleMenuProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150 }}
      shouldShow={({ editor, from, to }) => {
        // Mostra somente se houver texto selecionado
        return from !== to && !editor.isActive('image');
      }}
    >
      <Paper
        elevation={4}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 0.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title="Negrito">
          <IconButton
            size="small"
            color={editor.isActive('bold') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Itálico">
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

        <Tooltip title="Realce">
          <IconButton
            size="small"
            color={editor.isActive('highlight') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <HighlightIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Citação">
          <IconButton
            size="small"
            color={editor.isActive('blockquote') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <FormatQuoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    </BubbleMenu>
  );
};
