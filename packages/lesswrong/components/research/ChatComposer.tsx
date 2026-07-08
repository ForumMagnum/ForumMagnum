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
  /**
   * `button` (default) shows a round send button beside the box. `hint` matches
   * the in-document v2 conversation composer: a taller, rounder box with a
   * corner "⌘↵" affordance and no button.
   */
  submitStyle?: 'button' | 'hint';
}

const styles = defineStyles('ChatComposer', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    borderTop: `1px solid ${researchWarmAlpha(0.07)}`,
    paddingTop: 10,
  },
  // Sized to match the in-document Lexical conversation composer (the expanded
  // `.research-conversation-composer` in ContentStylesValues): 15px chat font /
  // 1.5 line-height, ~2.6em min height, roomier padding and md radius — so the
  // sidebar reply box reads as the same input, not a smaller sibling.
  editorShell: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    boxSizing: 'border-box',
    padding: '10px 13px',
    background: researchInputBackground(theme),
    border: `1px solid ${researchWarmAlpha(0.16)}`,
    borderRadius: researchRadius.md,
    ...researchSquircle,
    fontFamily: researchChatSans,
    fontSize: 15,
    lineHeight: 1.5,
    color: theme.palette.text.primary,
    cursor: 'text',
    transition: `border-color ${researchTransition}, box-shadow ${researchTransition}`,
    '&:hover': {
      borderColor: researchWarmAlpha(0.24),
    },
    '&:focus-within': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${researchAccentTint(0.12)}`,
    },
    '& [contenteditable="true"]': {
      outline: 'none',
      minHeight: 22,
      maxHeight: 160,
      overflowY: 'auto',
    },
  },
  editorShellDisabled: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  // Hint mode: taller, rounder box with room on the right for the corner ⌘↵,
  // matching the in-document v2 conversation composer.
  editorShellHint: {
    position: 'relative',
    minHeight: 50,
    padding: '13px 46px 13px 15px',
    borderRadius: researchRadius.lg,
    borderColor: researchWarmAlpha(0.2),
  },
  hint: {
    position: 'absolute',
    right: 12,
    bottom: 9,
    fontSize: 11,
    lineHeight: 1,
    color: theme.palette.text.dim,
    pointerEvents: 'none',
    userSelect: 'none',
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

const ChatComposer = ({
  projectId,
  placeholder,
  disabled = false,
  onSubmit,
  extraActions,
  submitStyle = 'button',
}: ChatComposerProps) => {
  const classes = useStyles(styles);
  // In hint mode the corner "⌘↵" already conveys how to send, so the placeholder
  // stays terse; button mode spells it out.
  const effectivePlaceholder = placeholder ?? (submitStyle === 'hint' ? 'Reply…' : 'Reply… (⌘↵ to send)');
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
      <div
        className={classNames(
          'research-chat-composer',
          classes.editorShell,
          submitStyle === 'hint' && classes.editorShellHint,
          disabled && classes.editorShellDisabled,
        )}
      >
        <LexicalEditorRoot
          data=""
          placeholder={effectivePlaceholder}
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
        {submitStyle === 'hint' ? <span className={classes.hint} aria-hidden="true">⌘↵</span> : null}
      </div>
      {submitStyle === 'button' || extraActions ? (
        <div className={classes.actions}>
          {extraActions}
          {submitStyle === 'button' ? (
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ChatComposer;
