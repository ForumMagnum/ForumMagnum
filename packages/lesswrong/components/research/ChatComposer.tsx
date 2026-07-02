'use client';

import React, { useCallback, useRef } from 'react';
import classNames from 'classnames';
import { $getRoot, type LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useFormSubmitOnCmdEnter } from '@/components/hooks/useFormSubmitOnCmdEnter';
import ForumIcon from '@/components/common/ForumIcon';
import LexicalEditorRoot from '@/components/editor/LexicalEditor';
import { chatComposerNodes } from './lexical/chatComposerNodes';
import { MentionTypeaheadPlugin } from './lexical/MentionTypeaheadPlugin';
import { researchAccentTint, researchChatSans, researchTransition, researchWarmAlpha, researchInputBackground, researchRadius, researchSquircle } from './researchStyleUtils';

interface ChatComposerProps {
  projectId: string;
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (promptHtml: string) => Promise<void> | void;
  extraActions?: React.ReactNode;
}

const styles = defineStyles('ChatComposer', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    borderTop: `1px solid ${researchWarmAlpha(0.07)}`,
    paddingTop: 10,
  },
  // A clearly-separate input field: flat surface, hairline border, rounded,
  // with a quiet sage focus — no grey fill (surface tints read as cheap
  // here; separation comes from the border and spacing).
  editorShell: {
    flex: 1,
    minWidth: 0,
    minHeight: 34,
    boxSizing: 'border-box',
    padding: '7px 12px',
    background: researchInputBackground(theme),
    border: `1px solid ${researchWarmAlpha(0.12)}`,
    borderRadius: researchRadius.sm,
    ...researchSquircle,
    fontFamily: researchChatSans,
    fontSize: 14,
    lineHeight: 1.45,
    color: theme.palette.text.primary,
    cursor: 'text',
    transition: `border-color ${researchTransition}, box-shadow ${researchTransition}`,
    '&:hover': {
      borderColor: researchWarmAlpha(0.2),
    },
    '&:focus-within': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${researchAccentTint(0.12)}`,
    },
    '& [contenteditable="true"]': {
      outline: 'none',
      minHeight: 20,
      maxHeight: 160,
      overflowY: 'auto',
    },
  },
  editorShellDisabled: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  sendButton: {
    flex: 'none',
    width: 26,
    height: 26,
    padding: 0,
    border: 'none',
    borderRadius: '50%',
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `background ${researchTransition}, opacity ${researchTransition}`,
    '&:hover': {
      background: theme.palette.primary.dark,
    },
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
  },
  sendIcon: {
    '--icon-size': '14px',
  },
}));

/**
 * Compact inline composer for conversation blocks: borderless editor with a
 * hairline top divider and a circular paper-airplane send button. Submits on
 * ⌘/Ctrl+Enter; clears only once the send succeeds (a dispatch failure keeps
 * the draft so the user can re-send).
 */
const ChatComposer = ({
  projectId,
  placeholder = 'Reply… (⌘↵ to send)',
  disabled = false,
  onSubmit,
  extraActions,
}: ChatComposerProps) => {
  const classes = useStyles(styles);
  const editorRef = useRef<LexicalEditor | null>(null);

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
      {/* The extra global class opts this nested editor out of the
          researchDocument content styles (full-height reading column), which
          otherwise match any descendant contenteditable of the document
          editor — see ContentStylesValues.ts. */}
      <div className={classNames('research-chat-composer', classes.editorShell, disabled && classes.editorShellDisabled)}>
        <LexicalEditorRoot
          data=""
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
          title="Send (⌘↵)"
          aria-label="Send"
        >
          <ForumIcon icon="ArrowRightOutline" className={classes.sendIcon} />
        </button>
      </div>
    </div>
  );
};

export default ChatComposer;
