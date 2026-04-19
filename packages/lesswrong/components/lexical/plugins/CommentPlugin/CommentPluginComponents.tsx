import React, { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import type { EditorState, LexicalCommand, LexicalEditor } from 'lexical';
import { CLEAR_EDITOR_COMMAND, COMMAND_PRIORITY_NORMAL, KEY_ESCAPE_COMMAND, createCommand } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $isRootTextContentEmpty, $rootTextContent } from '@lexical/text';
import { createComment, type Comment, type Thread } from '../../commenting';
import { ACCEPT_SUGGESTION_COMMAND, REJECT_SUGGESTION_COMMAND } from '@/components/editor/lexicalPlugins/suggestedEdits/Commands';
import { useCollabAuthorName } from '../../commenting/CommentStoreContext';
import { useCurrentCollaboratorId, useCollaboratorIdentity, useCanRejectSuggestion } from '../../collaboration';
import { accessLevelCan } from '@/lib/collections/posts/collabEditingPermissions';
import CommentEditorTheme from '../../themes/CommentEditorTheme';
import ContentEditable from '../../ui/ContentEditable';
import Button from '../../ui/Button';
import { SendIcon } from '../../icons/SendIcon';
import ForumIcon from '@/components/common/ForumIcon';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('CommentPluginComponents', (theme: ThemeType) => ({
  commentInputBoxEditorContainer: {
    position: 'relative',
    margin: '6px 8px 8px',
    borderRadius: 5,
    '--lexical-comment-placeholder-top': '7px',
    '--lexical-comment-placeholder-left': '8px',
    '--lexical-comment-min-height': '34px',
  },
  editor: {
    position: 'relative',
    border: theme.palette.greyBorder('1px', 0.2),
    backgroundColor: theme.palette.background.default,
    borderRadius: 6,
    fontSize: 13,
    lineHeight: '1.45',
    caretColor: theme.palette.grey[900],
    display: 'block',
    padding: '7px 30px 7px 8px',
    minHeight: 34,
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    '&:focus-within': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 1px ${theme.palette.primary.light}`,
    },
  },
  sendButton: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    '&&': {
      background: 'none',
      padding: 0,
      minWidth: 'unset',
      minHeight: 'unset',
    },
    '&:hover': {
      '&&': {
        background: 'none',
      },
      '& $sendIcon': {
        opacity: 1,
        color: theme.palette.primary.main,
      },
    },
    '&:disabled $sendIcon': {
      opacity: 0.2,
    },
    '&:disabled:hover $sendIcon': {
      opacity: 0.2,
      filter: 'none',
    },
  },
  sendIcon: {
    display: 'block',
    height: 18,
    width: 18,
    opacity: 0.5,
    transition: 'opacity 0.15s ease-in-out, color 0.15s ease-in-out',
  },
  suggestionActions: {
    display: 'flex',
    gap: 6,
  },
  suggestionActionButton: {
    padding: 0,
    height: 16,
    width: 16,
    cursor: 'pointer',
    background: 'unset',
  },
  suggestionActionButtonIcon: {
    height: 16,
    width: 16,
  },
  suggestionStatus: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.grey[600],
    marginTop: 6,
  },
}));

function EscapeHandlerPlugin({
  onEscape,
}: {
  onEscape: (e: KeyboardEvent) => boolean;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event: KeyboardEvent) => {
        return onEscape(event);
      },
      COMMAND_PRIORITY_NORMAL,
    );
  }, [editor, onEscape]);

  return null;
}

const commentEditorInitialConfig = {
  namespace: 'Commenting',
  nodes: [] as const,
  onError: (error: Error) => {
    throw error;
  },
  theme: CommentEditorTheme,
};

export function PlainTextEditor({
  className,
  autoFocus,
  onEscape,
  onChange,
  editorRef,
  placeholder = 'Type a comment...',
}: {
  autoFocus?: boolean;
  className?: string;
  editorRef?: { current: null | LexicalEditor };
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
  onEscape: (e: KeyboardEvent) => boolean;
  placeholder?: string;
}) {
  const classes = useStyles(styles);
  return (
    <LexicalComposer initialConfig={commentEditorInitialConfig}>
      <div className={classes.commentInputBoxEditorContainer}>
        <PlainTextPlugin
          contentEditable={
            <ContentEditable placeholder={placeholder} className={className} variant="comment" />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={onChange} />
        <HistoryPlugin />
        {autoFocus !== false && <AutoFocusPlugin />}
        <EscapeHandlerPlugin onEscape={onEscape} />
        <ClearEditorPlugin />
        {editorRef !== undefined && <EditorRefPlugin editorRef={editorRef} />}
      </div>
    </LexicalComposer>
  );
}

export function useOnChange(
  setContent: (text: string) => void,
  setCanSubmit: (canSubmit: boolean) => void,
) {
  return useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      editorState.read(() => {
        setContent($rootTextContent());
        setCanSubmit(!$isRootTextContentEmpty(_editor.isComposing(), true));
      });
    },
    [setCanSubmit, setContent],
  );
}

export function CommentsComposer({
  submitAddComment,
  thread,
  placeholder,
  autoFocus,
}: {
  placeholder?: string;
  autoFocus?: boolean;
  submitAddComment: (
    commentOrThread: Comment,
    isInlineComment: boolean,
    thread?: Thread,
  ) => void;
  thread?: Thread;
}) {
  const classes = useStyles(styles);
  const [content, setContent] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const editorRef = useRef<LexicalEditor>(null);
  const author = useCollabAuthorName();
  const authorId = useCurrentCollaboratorId();

  const onChange = useOnChange(setContent, setCanSubmit);

  const submitComment = () => {
    if (canSubmit) {
      submitAddComment(createComment(content, author, authorId), false, thread);
      const editor = editorRef.current;
      if (editor !== null) {
        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
      }
    }
  };

  return (
    <>
      <PlainTextEditor
        className={classes.editor}
        autoFocus={autoFocus ?? false}
        onEscape={() => {
          return true;
        }}
        onChange={onChange}
        editorRef={editorRef}
        placeholder={placeholder}
      />
      <Button
        className={classes.sendButton}
        onClick={submitComment}
        disabled={!canSubmit}>
        <SendIcon className={classes.sendIcon} />
      </Button>
    </>
  );
}

export function SuggestionStatusOrActions({
  status,
  suggestionAuthorId,
  onAccept,
  onReject,
}: {
  status: 'open' | 'accepted' | 'rejected' | 'archived';
  suggestionAuthorId: string | undefined;
  onAccept: () => void;
  onReject: () => void;
}): JSX.Element | null {
  const classes = useStyles(styles);
  const { accessLevel } = useCollaboratorIdentity();
  const canRejectSuggestion = useCanRejectSuggestion();

  if (status !== 'open') {
    return (
      <div className={classes.suggestionStatus}>
        {status === 'accepted'
          ? 'Accepted'
          : status === 'rejected'
            ? 'Rejected'
            : 'Archived'}
      </div>
    );
  }

  const canAccept = accessLevelCan(accessLevel, "edit");
  const canReject = suggestionAuthorId ? canRejectSuggestion(suggestionAuthorId) : false;

  if (!canAccept && !canReject) {
    return null;
  }

  return (
    <div className={classes.suggestionActions}>
      {canAccept && (
        <button
          type="button"
          className={classes.suggestionActionButton}
          onClick={onAccept}
          title="Accept suggestion"
        >
          <ForumIcon icon="Check" className={classes.suggestionActionButtonIcon} />
        </button>
      )}
      {canReject && (
        <button
          type="button"
          className={classes.suggestionActionButton}
          onClick={onReject}
          title="Reject suggestion"
        >
          <ForumIcon icon="Close" className={classes.suggestionActionButtonIcon} />
        </button>
      )}
    </div>
  );
}

/** Returns the mark node ID for a thread (differs for suggestions vs comments). */
export function getThreadMarkId(thread: Thread): string {
  return thread.threadType === 'suggestion'
    ? (thread.markID ?? thread.id)
    : thread.id;
}

export function acceptSuggestionThread(editor: LexicalEditor, thread: Thread): void {
  editor.dispatchCommand(ACCEPT_SUGGESTION_COMMAND, getThreadMarkId(thread));
}

export function rejectSuggestionThread(editor: LexicalEditor, thread: Thread): void {
  editor.dispatchCommand(REJECT_SUGGESTION_COMMAND, getThreadMarkId(thread));
}

export interface ResolveThreadPayload {
  threadId: string;
  markId: string;
}

export const RESOLVE_THREAD_COMMAND: LexicalCommand<ResolveThreadPayload> = createCommand(
  'RESOLVE_THREAD_COMMAND',
);
