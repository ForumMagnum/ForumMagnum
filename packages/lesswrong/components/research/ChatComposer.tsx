'use client';

import React, { useCallback, useRef } from 'react';
import classNames from 'classnames';
import { $getRoot, type LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useFormSubmitOnCmdEnter } from '@/components/hooks/useFormSubmitOnCmdEnter';
import LexicalEditorRoot from '@/components/editor/LexicalEditor';
import { chatComposerNodes } from './lexical/researchEditorNodes';
import { MentionTypeaheadPlugin } from './lexical/MentionTypeaheadPlugin';

interface ChatComposerProps {
  projectId: string;
  placeholder?: string;
  disabled?: boolean;
  sendButtonLabel?: string;
  onSubmit: (promptHtml: string) => Promise<void> | void;
  extraActions?: React.ReactNode;
}

const styles = defineStyles('ChatComposer', (theme: ThemeType) => ({
  root: {
    borderTop: theme.palette.greyBorder('1px', 0.1),
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  editorShell: {
    minHeight: 80,
    padding: 8,
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 4,
    background: theme.palette.background.default,
    fontFamily: 'inherit',
    fontSize: 14,
    lineHeight: 1.4,
    color: theme.palette.text.primary,
    cursor: 'text',
    '& [contenteditable="true"]': {
      outline: 'none',
      minHeight: 64,
    },
  },
  editorShellDisabled: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  sendButton: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: 4,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
}));

const ChatComposer = ({
  projectId,
  placeholder = 'Ask anything…',
  disabled = false,
  sendButtonLabel = 'Send',
  onSubmit,
  extraActions,
}: ChatComposerProps) => {
  const classes = useStyles(styles);
  const editorRef = useRef<LexicalEditor | null>(null);

  const ignoreHtmlChange = useCallback((_html: string) => {
    // Editor state is serialized to HTML at submit time via $generateHtmlFromNodes.
  }, []);

  const handleSend = useCallback(async () => {
    if (disabled) return;
    const editor = editorRef.current;
    if (!editor) return;
    let promptHtml = '';
    let isEmpty = true;
    editor.read(() => {
      isEmpty = $getRoot().getTextContent().trim().length === 0;
      if (!isEmpty) promptHtml = $generateHtmlFromNodes(editor, null);
    });
    if (isEmpty) return;
    // Clear the editor only once the send succeeds. On a dispatch failure
    // `onSubmit` rethrows (the user turn isn't persisted until Claude echoes
    // it, so a lost prompt would be lost for good) — keep the prompt so the
    // user can re-send. `onSubmit` surfaces the error to the user itself.
    try {
      await onSubmit(promptHtml);
    } catch {
      return;
    }
    editor.update(() => {
      $getRoot().clear();
    });
  }, [disabled, onSubmit]);

  const rootRef = useFormSubmitOnCmdEnter<HTMLDivElement>(handleSend);

  return (
    <div className={classes.root} ref={rootRef}>
      <div className={classNames(classes.editorShell, disabled && classes.editorShellDisabled)}>
        <LexicalEditorRoot
          data=""
          onChange={ignoreHtmlChange}
          placeholder={placeholder}
          // No collectionName / documentId → collaboration is skipped
          // (see `shouldEnableCollaboration` in LexicalEditorRoot).
          extraNodes={chatComposerNodes}
          disableComponentPicker
          disableMentions
          commentEditor
        >
          <EditorRefPlugin editorRef={editorRef} />
          <MentionTypeaheadPlugin projectId={projectId} />
        </LexicalEditorRoot>
      </div>
      <div className={classes.actions}>
        {extraActions}
        <button
          type="button"
          className={classes.sendButton}
          onClick={handleSend}
          disabled={disabled}
        >
          {sendButtonLabel}
        </button>
      </div>
    </div>
  );
};

export default ChatComposer;
