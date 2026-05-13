'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import {
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LexicalEditorRoot from '@/components/editor/LexicalEditor';
import { chatComposerNodes } from './lexical/researchEditorNodes';
import { MentionTypeaheadPlugin } from './lexical/MentionTypeaheadPlugin';

interface ChatComposerProps {
  projectId: string;
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (text: string) => Promise<void> | void;
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
  onSubmit,
  extraActions,
}: ChatComposerProps) => {
  const classes = useStyles(styles);
  const editorRef = useRef<LexicalEditor | null>(null);

  const ignoreHtmlChange = useCallback((_html: string) => {
    // Editor state is read directly at submit time via `getTextContent()`.
  }, []);

  const handleSend = useCallback(async () => {
    if (disabled) return;
    const editor = editorRef.current;
    if (!editor) return;
    const text = editor.read(() => $getRoot().getTextContent());
    if (text.trim().length === 0) return;
    await onSubmit(text);
    editor.update(() => {
      $getRoot().clear();
    });
  }, [disabled, onSubmit]);

  return (
    <div className={classes.root}>
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
          <ChatComposerControlPlugin
            registerEditor={(editor) => { editorRef.current = editor; }}
            onSubmitShortcut={handleSend}
          />
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
          Send
        </button>
      </div>
    </div>
  );
};

interface ChatComposerControlPluginProps {
  registerEditor: (editor: LexicalEditor) => void;
  onSubmitShortcut: () => void;
}

function ChatComposerControlPlugin({
  registerEditor,
  onSubmitShortcut,
}: ChatComposerControlPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    registerEditor(editor);
  }, [editor, registerEditor]);

  // Pinned via a ref so the Enter-command registration below stays stable
  // across renders and doesn't tear down/rebuild on each `onSubmitShortcut`
  // identity change.
  const submitShortcutRef = useRef(onSubmitShortcut);
  useEffect(() => { submitShortcutRef.current = onSubmitShortcut; }, [onSubmitShortcut]);
  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          submitShortcutRef.current();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}

export default ChatComposer;
