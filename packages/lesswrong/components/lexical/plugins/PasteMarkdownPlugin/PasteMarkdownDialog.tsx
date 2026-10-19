'use client';

import React, { type JSX, useEffect, useRef } from 'react';
import { $getRoot, $getSelection, PASTE_COMMAND, type LexicalEditor } from 'lexical';
import LWDialog from '@/components/common/LWDialog';
import { DialogTitle } from '@/components/widgets/DialogTitle';
import { DialogContent } from '@/components/widgets/DialogContent';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getMarkdownItForAgentPosts } from '@/lib/utils/markdownItPlugins';
import { sanitize } from '@/lib/utils/sanitize';
import { randomId } from '@/lib/random';

const styles = defineStyles('PasteMarkdownDialog', (theme: ThemeType) => ({
  paper: {
    width: 500,
    maxWidth: '90vw',
  },
  instructions: {
    color: theme.palette.text.dim,
    fontSize: 13,
    marginBottom: 8,
  },
  textarea: {
    width: '100%',
    minHeight: 160,
    boxSizing: 'border-box',
    padding: 8,
    fontFamily: theme.typography.code.fontFamily,
    fontSize: 13,
    color: theme.palette.text.normal,
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: 4,
    resize: 'vertical',
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
    },
  },
}));

/**
 * Render markdown to HTML using the same markdown-it configuration as the
 * agent write path, which emits math as `math-tex` spans so that it imports
 * as editable MathNodes rather than as literal `$...$` text.
 */
function markdownToHtml(markdown: string): string {
  return sanitize(getMarkdownItForAgentPosts().render(markdown, { docId: randomId() }));
}

/**
 * Insert markdown at the editor's current selection by converting it to HTML
 * and running it through the editor's normal paste pipeline.
 */
function insertMarkdownIntoEditor(editor: LexicalEditor, markdown: string) {
  const dataTransfer = new DataTransfer();
  dataTransfer.setData('text/html', markdownToHtml(markdown));
  dataTransfer.setData('text/plain', markdown);

  editor.update(() => {
    // The paste handler is a no-op without a selection, so if the selection
    // got lost while the dialog was open, fall back to the end of the document.
    if (!$getSelection()) {
      $getRoot().selectEnd();
    }
  }, { discrete: true });
  editor.focus();
  editor.dispatchCommand(PASTE_COMMAND, new ClipboardEvent('paste', { clipboardData: dataTransfer }));
}

export function PasteMarkdownDialog({ activeEditor, onClose }: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const classes = useStyles(styles);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const markdown = event.clipboardData.getData('text/plain');
    if (!markdown.trim()) return;
    event.preventDefault();
    onClose();
    insertMarkdownIntoEditor(activeEditor, markdown);
  };

  return (
    <LWDialog open={true} onClose={onClose} maxWidth={false} paperClassName={classes.paper}>
      <DialogTitle>Paste as Markdown</DialogTitle>
      <DialogContent>
        <div className={classes.instructions}>
          Paste markdown below. It will be converted and inserted into your document.
        </div>
        <textarea
          ref={textareaRef}
          className={classes.textarea}
          onPaste={handlePaste}
          placeholder="Paste markdown here"
          aria-label="Markdown to paste"
          data-test-id="paste-markdown-textarea"
        />
      </DialogContent>
    </LWDialog>
  );
}
