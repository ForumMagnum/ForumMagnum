'use client';

import React, { type JSX } from 'react';
import { $getRoot, $getSelection, PASTE_TAG, type LexicalEditor } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { $insertGeneratedNodes } from '@lexical/clipboard';
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
 * and importing that the same way the rich-text paste handler imports pasted
 * HTML. This doesn't dispatch PASTE_COMMAND with a synthetic ClipboardEvent,
 * because Firefox ignores the `clipboardData` passed to the ClipboardEvent
 * constructor, so the paste handler would see an empty clipboard.
 */
function insertMarkdownIntoEditor(editor: LexicalEditor, markdown: string) {
  const dom = new DOMParser().parseFromString(markdownToHtml(markdown), 'text/html');
  editor.update(() => {
    const nodes = $generateNodesFromDOM(editor, dom);
    // If the selection got lost while the dialog was open, fall back to the
    // end of the document.
    const selection = $getSelection() ?? $getRoot().selectEnd();
    $insertGeneratedNodes(editor, nodes, selection);
  }, { tag: PASTE_TAG });
  editor.focus();
}

export function PasteMarkdownDialog({ activeEditor, onClose }: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const classes = useStyles(styles);

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
        {/* LWDialog only mounts its children after its first render, so this
            has to be autoFocus rather than a focus() call in a mount effect,
            which would run before the textarea exists. */}
        <textarea
          autoFocus
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
