/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  EditorState,
  LexicalCommand,
  LexicalEditor,
  NodeKey,
  RangeSelection,
} from 'lexical';
import React, { type JSX } from 'react';

import {
  $createMarkNode,
  $isMarkNode,
  $unwrapMarkNode,
  $wrapSelectionInMarkNode,
  MarkNode,
} from '@lexical/mark';
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {ClearEditorPlugin} from '@lexical/react/LexicalClearEditorPlugin';
import {useCollaborationContext} from '@lexical/react/LexicalCollaborationContext';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {EditorRefPlugin} from '@lexical/react/LexicalEditorRefPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {createDOMRange, createRectsFromDOMRange} from '@lexical/selection';
import {$isRootTextContentEmpty, $rootTextContent} from '@lexical/text';
import {mergeRegister, registerNestedElementResolver} from '@lexical/utils';
import {
  $addUpdateTag,
  $createRangeSelection,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  CLEAR_EDITOR_COMMAND,
  COLLABORATION_TAG,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  getDOMSelection,
  HISTORY_MERGE_TAG,
  KEY_ESCAPE_COMMAND,
} from 'lexical';
import moment from 'moment';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {createPortal} from 'react-dom';

import { useLexicalEditorContext } from '@/components/editor/LexicalEditorContext';
import { useMarkNodesContext } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext';
import { useCommentStoreContext } from '@/components/lexical/commenting/CommentStoreContext';
import { $isSuggestionNode } from '@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode';
import {
  Comment,
  Comments,
  CommentStore,
  createComment,
  createThread,
  Thread,
  useCollabAuthorName,
  useCommentStore,
} from '../../commenting';
import { ACCEPT_SUGGESTION_COMMAND, REJECT_SUGGESTION_COMMAND } from '@/components/editor/lexicalPlugins/suggestedEdits/Commands';
import useModal from '../../hooks/useModal';
import CommentEditorTheme from '../../themes/CommentEditorTheme';
import Button from '../../ui/Button';
import ContentEditable from '../../ui/ContentEditable';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

import { ChatLeftTextIcon } from '../../icons/ChatLeftTextIcon';
import { CommentsIcon } from '../../icons/CommentsIcon';
import { SendIcon } from '../../icons/SendIcon';
import { Trash3Icon } from '../../icons/Trash3Icon';
import ForumIcon from '@/components/common/ForumIcon';

const styles = defineStyles('LexicalCommentPlugin', (theme: ThemeType) => ({
  addCommentBox: {
    display: 'block',
    position: 'fixed',
    borderRadius: 20,
    backgroundColor: theme.palette.grey[0],
    width: 40,
    height: 60,
    boxShadow: `0 0 3px ${theme.palette.greyAlpha(0.2)}`,
    zIndex: 10,
    '@media (max-width: 600px)': {
      display: 'none',
    },
  },
  addCommentBoxButton: {
    borderRadius: 20,
    border: 0,
    background: 'none',
    width: 40,
    height: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
  },
  addCommentIcon: {
    display: 'inline-block',
    height: 20,
    width: 20,
    verticalAlign: '-10px',
  },
  commentInputBox: {
    display: 'block',
    position: 'absolute',
    width: 250,
    minHeight: 80,
    backgroundColor: theme.palette.grey[0],
    boxShadow: `0 0 5px 0 ${theme.palette.greyAlpha(0.1)}`,
    borderRadius: 5,
    zIndex: 24,
    animation: '$showInputBox 0.4s ease',
    '&::before': {
      content: '""',
      position: 'absolute',
      width: 0,
      height: 0,
      marginLeft: '0.5em',
      right: '-1em',
      top: 0,
      left: 'calc(50% + 0.25em)',
      boxSizing: 'border-box',
      border: `0.5em solid ${theme.palette.grey[1000]}`,
      borderColor: `transparent transparent ${theme.palette.grey[0]} ${theme.palette.grey[0]}`,
      transformOrigin: '0 0',
      transform: 'rotate(135deg)',
      boxShadow: `-3px 3px 3px 0 ${theme.palette.greyAlpha(0.05)}`,
    },
  },
  '@keyframes showInputBox': {
    '0%': {
      opacity: 0,
      transform: 'translateY(50px)',
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  commentInputBoxButtons: {
    display: 'flex',
    flexDirection: 'row',
    padding: '0 10px 10px 10px',
    gap: 10,
  },
  commentInputBoxButton: {
    flex: 1,
  },
  commentInputBoxButtonPrimary: {
    backgroundColor: theme.palette.lexicalEditor.commentInputBoxButtonBackground,
    fontWeight: 'bold',
    color: theme.palette.grey[0],
    '&:hover': {
      backgroundColor: theme.palette.lexicalEditor.commentInputBoxButtonHoverBackground,
    },
    '&:disabled': {
      backgroundColor: theme.palette.grey[200],
      opacity: 0.5,
      cursor: 'not-allowed',
      fontWeight: 'normal',
      color: theme.palette.grey[700],
      '&:hover': {
        opacity: 0.5,
        backgroundColor: theme.palette.grey[200],
      },
    },
  },
  commentInputBoxEditorContainer: {
    position: 'relative',
    margin: 10,
    borderRadius: 5,
    '--lexical-comment-placeholder-top': '10px',
    '--lexical-comment-placeholder-left': '10px',
    '--lexical-comment-min-height': '30px',
  },
  commentInputBoxEditor: {
    position: 'relative',
    border: `1px solid ${theme.palette.grey[400]}`,
    backgroundColor: theme.palette.grey[0],
    borderRadius: 5,
    fontSize: 15,
    caretColor: theme.palette.grey[900],
    display: 'block',
    padding: '9px 10px 10px 9px',
    minHeight: 80,
    '&:focus': {
      outline: `1px solid ${theme.palette.lexicalEditor.commentInputBoxButtonBackground}`,
    },
  },
  showCommentsButton: {
    position: 'fixed',
    top: 70,
    right: 6,
    backgroundColor: theme.palette.grey[300],
    borderRadius: 10,
    '@media (max-width: 600px)': {
      display: 'none',
    },
    '&:hover $commentsIcon': {
      opacity: 1,
    },
  },
  showCommentsButtonActive: {
    backgroundColor: theme.palette.grey[400],
  },
  commentsIcon: {
    display: 'inline-block',
    height: 20,
    width: 20,
    verticalAlign: '-10px',
    opacity: 0.5,
    transition: 'opacity 0.2s linear',
  },
  commentsPanel: {
    position: 'fixed',
    right: 0,
    width: 300,
    height: 'calc(100% - 88px)',
    top: 118,
    backgroundColor: theme.palette.grey[100],
    borderTopLeftRadius: 10,
    animation: '$showComments 0.2s ease',
    zIndex: 25,
    ...theme.typography.commentStyle,
  },
  '@keyframes showComments': {
    '0%': {
      opacity: 0,
      transform: 'translateX(300px)',
    },
    '100%': {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
  commentsPanelHeading: {
    paddingLeft: 15,
    paddingTop: 10,
    margin: 0,
    height: 34,
    fontSize: 20,
    display: 'block',
    width: '100%',
    color: theme.palette.grey[700],
    overflow: 'hidden',
  },
  commentsPanelEditor: {
    position: 'relative',
    border: `1px solid ${theme.palette.grey[400]}`,
    backgroundColor: theme.palette.grey[0],
    borderRadius: 5,
    fontSize: 15,
    caretColor: theme.palette.grey[900],
    display: 'block',
    padding: '9px 10px 10px 9px',
    minHeight: 20,
    '&::before': {
      content: '""',
      width: 30,
      height: 20,
      float: 'right',
    },
  },
  commentsPanelSendButton: {
    position: 'absolute',
    right: 10,
    top: 8,
    background: 'none',
    '&:hover': {
      background: 'none',
      '& $sendIcon': {
        opacity: 1,
        filter: 'invert(45%) sepia(98%) saturate(2299%) hue-rotate(201deg) brightness(100%) contrast(92%)',
      },
    },
    '&:disabled $sendIcon': {
      opacity: 0.3,
    },
    '&:disabled:hover $sendIcon': {
      opacity: 0.3,
      filter: 'none',
    },
  },
  sendIcon: {
    display: 'inline-block',
    height: 20,
    width: 20,
    verticalAlign: '-10px',
    opacity: 0.5,
    transition: 'opacity 0.2s linear',
  },
  commentsPanelEmpty: {
    color: theme.palette.grey[600],
    fontSize: 15,
    textAlign: 'center',
    position: 'absolute',
    top: 'calc(50% - 15px)',
    margin: 0,
    padding: 0,
    width: '100%',
  },
  commentsPanelList: {
    padding: 0,
    listStyleType: 'none',
    margin: 0,
    width: '100%',
    position: 'absolute',
    top: 45,
    overflowY: 'auto',
    height: 'calc(100% - 45px)',
  },
  listComment: {
    padding: '12px 16px',
    margin: 0,
    fontSize: 15,
    position: 'relative',
    transition: 'all 0.2s linear',
    borderTop: `1px solid ${theme.palette.grey[200]}`,
    '&:first-child': {
      borderTop: 'none',
    },
    '& p': {
      margin: 0,
      marginTop: 4,
      color: theme.palette.grey[900],
      lineHeight: 1.5,
    },
  },
  listDetails: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 2,
    fontSize: 13,
    color: theme.palette.grey[700],
  },
  commentAuthor: {
    fontWeight: 600,
    color: theme.palette.grey[900],
  },
  commentTime: {
    color: theme.palette.grey[600],
    fontSize: 12,
  },
  listThread: {
    padding: 0,
    margin: 0,
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    position: 'relative',
    transition: 'all 0.2s linear',
    '&:first-child': {
      borderTop: `1px solid ${theme.palette.grey[200]}`,
    },
  },
  listThreadInteractive: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
  },
  listThreadActive: {
    backgroundColor: theme.palette.grey[50],
    borderLeft: `4px solid ${theme.palette.primary.main}`, // More visible active state
    cursor: 'inherit',
    '& $listComment:hover': {
      backgroundColor: 'inherit',
    },
  },
  threadQuoteBox: {
    paddingTop: 12,
    paddingBottom: 4,
    color: theme.palette.grey[400],
    display: 'block',
    '&:hover $deleteButton': {
      opacity: 0.5,
    },
  },
  threadQuote: {
    margin: '0 16px',
    paddingLeft: 8,
    borderLeft: `3px solid ${theme.palette.grey[300]}`,
    '& span': {
      color: theme.palette.grey[700],
      backgroundColor: 'transparent',
      padding: 0,
      lineHeight: 1.4,
      display: 'inline',
      fontStyle: 'italic',
    },
  },
  suggestionSummary: {
    fontSize: 15,
    lineHeight: 1.5,
    marginTop: 0,
    marginBottom: 8,
    marginLeft: 16,
    marginRight: 16,
    color: theme.palette.grey[900],
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  suggestionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
    marginLeft: 16,
    marginRight: 16,
    fontSize: 13,
  },
  suggestionActions: {
    display: 'flex',
    gap: 6,
    marginTop: 6,
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
  threadComments: {
    paddingLeft: 10,
    listStyleType: 'none',
    '& $listComment:first-child': {
      border: 'none',
      marginLeft: 0,
      paddingLeft: 5,
    },
    '& $listComment:first-child:last-child': {
      paddingBottom: 5,
    },
    '& $listComment': {
      paddingLeft: 10,
      borderLeft: `5px solid ${theme.palette.grey[200]}`,
      marginLeft: 5,
    },
  },
  threadEditor: {
    position: 'relative',
    paddingTop: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    backgroundColor: 'transparent',
    opacity: 0,
    '&:hover': {
      backgroundColor: 'transparent',
      opacity: 1,
      filter: 'invert(45%) sepia(98%) saturate(2299%) hue-rotate(201deg) brightness(100%) contrast(92%)',
    },
  },
  deleteIcon: {
    position: 'absolute',
    left: 5,
    top: 5,
    height: 15,
    width: 15,
    verticalAlign: '-10px',
    transition: 'opacity 0.2s linear',
  },
  deletedComment: {
    opacity: 0.5,
  },
  listCommentHover: {
    '&:hover $deleteButton': {
      opacity: 0.5,
    },
  },
}));

const SUGGESTION_SUMMARY_KIND: Comment['commentKind'] = 'suggestionSummary';

const isSuggestionThread = (thread: Thread): boolean => thread.threadType === 'suggestion';

const getSuggestionSummaryComment = (thread: Thread): Comment | undefined =>
  thread.comments.find((comment) => comment.commentKind === SUGGESTION_SUMMARY_KIND);

const getSuggestionThreadId = (thread: Thread): string => thread.markID ?? thread.id;

const parseSuggestionSummary = (summary: string): string => {
  try {
    const parsed = JSON.parse(summary) as Array<{ type: string; content: string; replaceWith?: string }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return 'Suggestion';
    }
    const first = parsed[0];
    if (!first) {
      return summary;
    }
    if (first.replaceWith) {
      return `${first.type}: ${first.content} → ${first.replaceWith}`;
    }
    return first.content ? `${first.type}: ${first.content}` : first.type;
  } catch {
    return summary;
  }
};

const acceptSuggestionThread = (editor: LexicalEditor, commentStore: CommentStore, thread: Thread) => {
  const suggestionId = getSuggestionThreadId(thread);
  editor.dispatchCommand(ACCEPT_SUGGESTION_COMMAND, suggestionId);
  commentStore.updateThread(thread.id, {
    status: 'accepted',
  });
};

const rejectSuggestionThread = (editor: LexicalEditor, commentStore: CommentStore, thread: Thread) => {
  const suggestionId = getSuggestionThreadId(thread);
  editor.dispatchCommand(REJECT_SUGGESTION_COMMAND, suggestionId);
  commentStore.updateThread(thread.id, {
    status: 'rejected',
  });
};

export const INSERT_INLINE_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_INLINE_COMMAND',
);

export type InsertInlineCommentAtPayload = {
  rect: DOMRect;
};

export const INSERT_INLINE_COMMENT_AT_COMMAND: LexicalCommand<InsertInlineCommentAtPayload> = createCommand(
  'INSERT_INLINE_COMMENT_AT_COMMAND',
);

type SelectionSnapshot = {
  anchorKey: NodeKey;
  anchorOffset: number;
  focusKey: NodeKey;
  focusOffset: number;
};

export type InsertInlineThreadPayload = {
  threadId: string;
  initialContent: string;
  quote?: string;
  selectionSnapshot?: SelectionSnapshot;
};

export const INSERT_INLINE_THREAD_COMMAND: LexicalCommand<InsertInlineThreadPayload> = createCommand(
  'INSERT_INLINE_THREAD_COMMAND',
);

export type UpdateInlineThreadPayload = {
  threadId: string;
  quote?: string;
  firstCommentContent?: string;
};

function createRangeSelectionFromSnapshot(
  snapshot: SelectionSnapshot,
): RangeSelection | null {
  const anchorNode = $getNodeByKey(snapshot.anchorKey);
  const focusNode = $getNodeByKey(snapshot.focusKey);
  if (!anchorNode || !focusNode || !$isTextNode(anchorNode) || !$isTextNode(focusNode)) return null;
  const anchorOffset = Math.min(snapshot.anchorOffset, anchorNode.getTextContentSize());
  const focusOffset = Math.min(snapshot.focusOffset, focusNode.getTextContentSize());
  const range = $createRangeSelection();
  range.setTextNodeRange(anchorNode, anchorOffset, focusNode, focusOffset);
  return range;
}

export const UPDATE_INLINE_THREAD_COMMAND: LexicalCommand<UpdateInlineThreadPayload> = createCommand(
  'UPDATE_INLINE_THREAD_COMMAND',
);

export type HideThreadPayload = { threadId: string };

export const HIDE_THREAD_COMMAND: LexicalCommand<HideThreadPayload> = createCommand(
  'HIDE_THREAD_COMMAND',
);

function AddCommentBox({
  anchorKey,
  editor,
  onAddComment,
}: {
  anchorKey: NodeKey;
  editor: LexicalEditor;
  onAddComment: () => void;
}): JSX.Element {
  const classes = useStyles(styles);
  const boxRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const boxElem = boxRef.current;
    const rootElement = editor.getRootElement();
    const anchorElement = editor.getElementByKey(anchorKey);

    if (boxElem !== null && rootElement !== null && anchorElement !== null) {
      const {right} = rootElement.getBoundingClientRect();
      const {top} = anchorElement.getBoundingClientRect();
      boxElem.style.left = `${right - 20}px`;
      boxElem.style.top = `${top - 30}px`;
    }
  }, [anchorKey, editor]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [editor, updatePosition]);

  useLayoutEffect(() => {
    updatePosition();
  }, [anchorKey, editor, updatePosition]);

  return (
    <div className={classes.addCommentBox} ref={boxRef}>
      <button
        className={classes.addCommentBoxButton}
        onClick={onAddComment}>
        <ChatLeftTextIcon className={classes.addCommentIcon} />
      </button>
    </div>
  );
}

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

function PlainTextEditor({
  className,
  autoFocus,
  onEscape,
  onChange,
  editorRef,
  placeholder = 'Type a comment...',
}: {
  autoFocus?: boolean;
  className?: string;
  editorRef?: {current: null | LexicalEditor};
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
  onEscape: (e: KeyboardEvent) => boolean;
  placeholder?: string;
}) {
  const initialConfig = {
    namespace: 'Commenting',
    nodes: [],
    onError: (error: Error) => {
      throw error;
    },
    theme: CommentEditorTheme,
  };

  const classes = useStyles(styles);
  return (
    <LexicalComposer initialConfig={initialConfig}>
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

function useOnChange(
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

function CommentInputBox({
  editor,
  cancelAddComment,
  submitAddComment,
  anchorRect,
}: {
  cancelAddComment: () => void;
  editor: LexicalEditor;
  submitAddComment: (
    commentOrThread: Comment | Thread,
    isInlineComment: boolean,
    thread?: Thread,
    selection?: RangeSelection | null,
  ) => void;
  anchorRect: DOMRect | null;
}) {
  const classes = useStyles(styles);
  const [content, setContent] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const selectionState = useMemo(
    () => ({
      container: document.createElement('div'),
      elements: [],
    }),
    [],
  );
  const selectionRef = useRef<RangeSelection | null>(null);
  const author = useCollabAuthorName();

  const updateLocation = useCallback(() => {
    if (anchorRect) {
      const boxElem = boxRef.current;
      if (boxElem !== null) {
        const {left, width, bottom} = anchorRect;
        let correctedLeft = left + (width / 2) - 125;
        if (correctedLeft < 10) {
          correctedLeft = 10;
        }
        boxElem.style.left = `${correctedLeft}px`;
        boxElem.style.top = `${
          bottom +
          20 +
          (window.pageYOffset || document.documentElement.scrollTop)
        }px`;
      }
      const {container} = selectionState;
      const elements: Array<HTMLSpanElement> = selectionState.elements;
      for (let i = elements.length - 1; i >= 0; i--) {
        const elem = elements[i];
        container.removeChild(elem);
        elements.pop();
      }
      return;
    }

    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selectionRef.current = selection.clone();
        const anchor = selection.anchor;
        const focus = selection.focus;
        const range = createDOMRange(
          editor,
          anchor.getNode(),
          anchor.offset,
          focus.getNode(),
          focus.offset,
        );
        const boxElem = boxRef.current;
        if (range !== null && boxElem !== null) {
          const {left, bottom, width} = range.getBoundingClientRect();
          const selectionRects = createRectsFromDOMRange(editor, range);
          let correctedLeft =
            selectionRects.length === 1 ? left + (width / 2) - 125 : left - 125;
          if (correctedLeft < 10) {
            correctedLeft = 10;
          }
          boxElem.style.left = `${correctedLeft}px`;
          boxElem.style.top = `${
            bottom +
            20 +
            (window.pageYOffset || document.documentElement.scrollTop)
          }px`;
          const selectionRectsLength = selectionRects.length;
          const {container} = selectionState;
          const elements: Array<HTMLSpanElement> = selectionState.elements;
          const elementsLength = elements.length;

          for (let i = 0; i < selectionRectsLength; i++) {
            const selectionRect = selectionRects[i];
            let elem: HTMLSpanElement = elements[i];
            if (elem === undefined) {
              elem = document.createElement('span');
              elements[i] = elem;
              container.appendChild(elem);
            }
            const color = '255, 212, 0';
            const style = `position:absolute;top:${
              selectionRect.top +
              (window.pageYOffset || document.documentElement.scrollTop)
            }px;left:${selectionRect.left}px;height:${
              selectionRect.height
            }px;width:${
              selectionRect.width
            }px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;`;
            elem.style.cssText = style;
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i];
            container.removeChild(elem);
            elements.pop();
          }
        }
      }
    });
  }, [anchorRect, editor, selectionState]);

  useLayoutEffect(() => {
    updateLocation();
    const container = selectionState.container;
    const body = document.body;
    if (body !== null) {
      body.appendChild(container);
      return () => {
        body.removeChild(container);
      };
    }
  }, [selectionState.container, updateLocation]);

  useEffect(() => {
    window.addEventListener('resize', updateLocation);

    return () => {
      window.removeEventListener('resize', updateLocation);
    };
  }, [updateLocation]);

  const onEscape = (event: KeyboardEvent): boolean => {
    event.preventDefault();
    cancelAddComment();
    return true;
  };

  const submitComment = () => {
    if (canSubmit) {
      let quote = editor.getEditorState().read(() => {
        const selection = selectionRef.current;
        return selection ? selection.getTextContent() : '';
      });
      if (quote.length > 100) {
        quote = quote.slice(0, 99) + '…';
      }
      submitAddComment(
        createThread(quote, [createComment(content, author)]),
        true,
        undefined,
        selectionRef.current,
      );
      selectionRef.current = null;
    }
  };

  const onChange = useOnChange(setContent, setCanSubmit);

  return (
    <div className={classes.commentInputBox} ref={boxRef}>
      <PlainTextEditor
        className={classes.commentInputBoxEditor}
        onEscape={onEscape}
        onChange={onChange}
      />
      <div className={classes.commentInputBoxButtons}>
        <Button
          onClick={cancelAddComment}
          className={classes.commentInputBoxButton}>
          Cancel
        </Button>
        <Button
          onClick={submitComment}
          disabled={!canSubmit}
          className={classNames(classes.commentInputBoxButton, classes.commentInputBoxButtonPrimary)}>
          Comment
        </Button>
      </div>
    </div>
  );
}

function CommentsComposer({
  submitAddComment,
  thread,
  placeholder,
}: {
  placeholder?: string;
  submitAddComment: (
    commentOrThread: Comment,
    isInlineComment: boolean,
    // eslint-disable-next-line no-shadow
    thread?: Thread,
  ) => void;
  thread?: Thread;
}) {
  const classes = useStyles(styles);
  const [content, setContent] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const editorRef = useRef<LexicalEditor>(null);
  const author = useCollabAuthorName();

  const onChange = useOnChange(setContent, setCanSubmit);

  const submitComment = () => {
    if (canSubmit) {
      submitAddComment(createComment(content, author), false, thread);
      const editor = editorRef.current;
      if (editor !== null) {
        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
      }
    }
  };

  return (
    <>
      <PlainTextEditor
        className={classes.commentsPanelEditor}
        autoFocus={false}
        onEscape={() => {
          return true;
        }}
        onChange={onChange}
        editorRef={editorRef}
        placeholder={placeholder}
      />
      <Button
        className={classes.commentsPanelSendButton}
        onClick={submitComment}
        disabled={!canSubmit}>
        <SendIcon className={classes.sendIcon} />
      </Button>
    </>
  );
}

function ShowDeleteCommentOrThreadDialog({
  commentOrThread,
  deleteCommentOrThread,
  onClose,
  thread = undefined,
}: {
  commentOrThread: Comment | Thread;

  deleteCommentOrThread: (
    comment: Comment | Thread,
    // eslint-disable-next-line no-shadow
    thread?: Thread,
  ) => void;
  onClose: () => void;
  thread?: Thread;
}): JSX.Element {
  return (
    <>
      Are you sure you want to delete this {commentOrThread.type}?
      <div className="Modal__content">
        <Button
          onClick={() => {
            deleteCommentOrThread(commentOrThread, thread);
            onClose();
          }}>
          Delete
        </Button>{' '}
        <Button
          onClick={() => {
            onClose();
          }}>
          Cancel
        </Button>
      </div>
    </>
  );
}

function CommentsPanelListComment({
  comment,
  deleteComment,
  thread,
}: {
  comment: Comment;
  deleteComment: (
    commentOrThread: Comment | Thread,
    // eslint-disable-next-line no-shadow
    thread?: Thread,
  ) => void;
  thread?: Thread;
}): JSX.Element {
  const classes = useStyles(styles);
  const [modal, showModal] = useModal();

  return (
    <li className={classNames(classes.listComment, classes.listCommentHover)}>
      <div className={classes.listDetails}>
        <span className={classes.commentAuthor}>
          {comment.author}
        </span>
        <span className={classes.commentTime}>
          {moment(comment.timeStamp).format('MMMM DD, YYYY, h:mm A')}
        </span>
      </div>
      <p
        className={comment.deleted ? classes.deletedComment : ''}>
        {comment.content}
      </p>
      {!comment.deleted && (
        <>
          <Button
            onClick={() => {
              showModal('Delete Comment', (onClose) => (
                <ShowDeleteCommentOrThreadDialog
                  commentOrThread={comment}
                  deleteCommentOrThread={deleteComment}
                  thread={thread}
                  onClose={onClose}
                />
              ));
            }}
            className={classes.deleteButton}>
            <Trash3Icon className={classes.deleteIcon} />
          </Button>
          {modal}
        </>
      )}
    </li>
  );
}

function CommentsPanelList({
  activeIDs,
  comments,
  deleteCommentOrThread,
  listRef,
  submitAddComment,
  markNodeMap,
}: {
  activeIDs: Array<string>;
  comments: Comments;
  deleteCommentOrThread: (
    commentOrThread: Comment | Thread,
    thread?: Thread,
  ) => void;
  listRef: {current: null | HTMLUListElement};
  markNodeMap: Map<string, Set<NodeKey>>;
  submitAddComment: (
    commentOrThread: Comment | Thread,
    isInlineComment: boolean,
    thread?: Thread,
  ) => void;
}): JSX.Element {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const { commentStore } = useCommentStoreContext();
  const [counter, setCounter] = useState(0);
  const [modal, showModal] = useModal();

  useEffect(() => {
    // Used to keep the time stamp up to date
    const id = setTimeout(() => {
      setCounter(counter + 1);
    }, 10000);

    return () => {
      clearTimeout(id);
    };
  }, [counter]);

  return (
    <ul className={classes.commentsPanelList} ref={listRef}>
      {comments.map((commentOrThread) => {
        const id = commentOrThread.id;
        if (commentOrThread.type === 'thread') {
          const isSuggestion = isSuggestionThread(commentOrThread);
          const suggestionSummaryComment = isSuggestion
            ? getSuggestionSummaryComment(commentOrThread)
            : undefined;
          const suggestionSummaryText = suggestionSummaryComment
            ? parseSuggestionSummary(suggestionSummaryComment.content)
            : null;
          const suggestionStatus = commentOrThread.status ?? 'open';
          if (suggestionStatus === 'archived') {
            return null;
          }
          const threadMarkId = isSuggestion ? getSuggestionThreadId(commentOrThread) : id;
          const threadComments = isSuggestion
            ? commentOrThread.comments.filter(
                (comment) => comment.commentKind !== SUGGESTION_SUMMARY_KIND,
              )
            : commentOrThread.comments;

          const handleClickThread = () => {
            const markNodeKeys = markNodeMap.get(threadMarkId);
            if (
              markNodeKeys !== undefined &&
              (activeIDs === null || activeIDs.indexOf(threadMarkId) === -1)
            ) {
              const activeElement = document.activeElement;
              // Move selection to the start of the mark, so that we
              // update the UI with the selected thread.
              editor.update(
                () => {
                  const markNodeKey = Array.from(markNodeKeys)[0];
                  const markNode = $getNodeByKey(markNodeKey);
                  if ($isMarkNode(markNode) || $isSuggestionNode(markNode)) {
                    markNode.selectStart();
                  }
                },
                {
                  onUpdate() {
                    // Restore selection to the previous element
                    if (activeElement !== null) {
                      (activeElement as HTMLElement).focus();
                    }
                  },
                },
              );
            }
          };

          const showEditor = commentOrThread.status === 'open';

          return (
            <li
              key={id}
              onClick={handleClickThread}
              className={classNames(
                classes.listThread,
                { [classes.listThreadInteractive]: markNodeMap.has(threadMarkId) },
                { [classes.listThreadActive]: activeIDs.indexOf(threadMarkId) !== -1 }
              )}>
              <div className={classes.threadQuoteBox}>
                {!isSuggestion && (
                  <blockquote className={classes.threadQuote}>
                    {'> '}
                    <span>{commentOrThread.quote}</span>
                  </blockquote>
                )}
                {!isSuggestion && (
                  <>
                    <Button
                      onClick={() => {
                        showModal('Delete Thread', (onClose) => (
                          <ShowDeleteCommentOrThreadDialog
                            commentOrThread={commentOrThread}
                            deleteCommentOrThread={deleteCommentOrThread}
                            onClose={onClose}
                          />
                        ));
                      }}
                      className={classes.deleteButton}>
                      <Trash3Icon className={classes.deleteIcon} />
                    </Button>
                    {modal}
                  </>
                )}
                {isSuggestion && suggestionSummaryText && (
                  <>
                    {suggestionSummaryComment && (
                      <div className={classes.suggestionHeader}>
                        <span className={classes.commentAuthor}>
                          {suggestionSummaryComment.author}
                        </span>
                        <span className={classes.commentTime}>
                          {moment(suggestionSummaryComment.timeStamp).format('MMMM DD, YYYY, h:mm A')}
                        </span>
                      </div>
                    )}
                    <div className={classes.suggestionSummary}>
                      {suggestionSummaryText}
                      {suggestionStatus === 'open' ? (
                        <div className={classes.suggestionActions}>
                          <button
                            type="button"
                            className={classes.suggestionActionButton}
                            onClick={() => {
                              acceptSuggestionThread(editor, commentStore, commentOrThread);
                            }}
                          >
                            <ForumIcon icon="Check" className={classes.suggestionActionButtonIcon} />
                          </button>
                          <button
                            type="button"
                            className={classes.suggestionActionButton}
                            onClick={() => {
                              rejectSuggestionThread(editor, commentStore, commentOrThread);
                            }}
                          >
                            <ForumIcon icon="Close" className={classes.suggestionActionButtonIcon} />
                          </button>
                        </div>
                      ) : (
                        <div className={classes.suggestionStatus}>
                          {suggestionStatus === 'accepted'
                            ? 'Accepted'
                            : suggestionStatus === 'rejected'
                              ? 'Rejected'
                              : 'Archived'}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <ul className={classes.threadComments}>
                {threadComments.map((comment) => (
                  <CommentsPanelListComment
                    key={comment.id}
                    comment={comment}
                    deleteComment={deleteCommentOrThread}
                    thread={commentOrThread}
                  />
                ))}
              </ul>
              {showEditor && <div className={classes.threadEditor}>
                <CommentsComposer
                  submitAddComment={submitAddComment}
                  thread={commentOrThread}
                  placeholder="Reply to comment..."
                />
              </div>}
            </li>
          );
        }
        return (
          <CommentsPanelListComment
            key={id}
            comment={commentOrThread}
            deleteComment={deleteCommentOrThread}
          />
        );
      })}
    </ul>
  );
}

function CommentsPanel({
  activeIDs,
  deleteCommentOrThread,
  comments,
  submitAddComment,
  markNodeMap,
}: {
  activeIDs: Array<string>;
  comments: Comments;
  deleteCommentOrThread: (
    commentOrThread: Comment | Thread,
    thread?: Thread,
  ) => void;
  markNodeMap: Map<string, Set<NodeKey>>;
  submitAddComment: (
    commentOrThread: Comment | Thread,
    isInlineComment: boolean,
    thread?: Thread,
  ) => void;
}): JSX.Element {
  const classes = useStyles(styles);
  const listRef = useRef<HTMLUListElement>(null);
  const isEmpty = comments.length === 0;

  return (
    <div className={classes.commentsPanel}>
      <h2 className={classes.commentsPanelHeading}>Comments</h2>
      {isEmpty ? (
        <div className={classes.commentsPanelEmpty}>No Comments</div>
      ) : (
        <CommentsPanelList
          activeIDs={activeIDs}
          comments={comments}
          deleteCommentOrThread={deleteCommentOrThread}
          listRef={listRef}
          submitAddComment={submitAddComment}
          markNodeMap={markNodeMap}
        />
      )}
    </div>
  );
}

export default function CommentPlugin(): JSX.Element {
  const classes = useStyles(styles);
  const { isPostEditor } = useLexicalEditorContext();
  const [editor] = useLexicalComposerContext();
  const { commentStore } = useCommentStoreContext();
  const comments = useCommentStore(commentStore);
  const author = useCollabAuthorName();
  const { markNodeMap, activeIDs, activeAnchorKey } = useMarkNodesContext();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentAnchorRect, setCommentAnchorRect] = useState<DOMRect | null>(
    null,
  );
  const [showComments, setShowComments] = useState(false);
  const cancelAddComment = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      // Restore selection
      if (selection !== null) {
        selection.dirty = true;
      }
    });
    setCommentAnchorRect(null);
    setShowCommentInput(false);
  }, [editor]);

  const deleteCommentOrThread = useCallback(
    (comment: Comment | Thread, thread?: Thread) => {
      if (comment.type === 'comment') {
        const deletionInfo = commentStore.deleteCommentOrThread(
          comment,
          thread,
        );
        if (!deletionInfo) {
          return;
        }
        const {markedComment, index} = deletionInfo;
        commentStore.addComment(markedComment, thread, index);
      } else {
        commentStore.deleteCommentOrThread(comment);
        // Remove ids from associated marks
        const id = thread !== undefined ? thread.id : comment.id;
        const markNodeKeys = markNodeMap.get(id);
        if (markNodeKeys !== undefined) {
          // Do async to avoid causing a React infinite loop
          setTimeout(() => {
            editor.update(() => {
              for (const key of markNodeKeys) {
                const node: null | MarkNode = $getNodeByKey(key);
                if ($isMarkNode(node)) {
                  node.deleteID(id);
                  if (node.getIDs().length === 0) {
                    $unwrapMarkNode(node);
                  }
                }
              }
            });
          });
        }
      }
    },
    [commentStore, editor, markNodeMap],
  );

  const submitAddComment = useCallback(
    (
      commentOrThread: Comment | Thread,
      isInlineComment: boolean,
      thread?: Thread,
      selection?: RangeSelection | null,
    ) => {
      commentStore.addComment(commentOrThread, thread);
      if (isInlineComment) {
        editor.update(() => {
          if ($isRangeSelection(selection)) {
            const isBackward = selection.isBackward();
            const id = commentOrThread.id;

            // Wrap content in a MarkNode
            $wrapSelectionInMarkNode(selection, isBackward, id);
          }
        });
        setShowCommentInput(false);
        setCommentAnchorRect(null);
      }
    },
    [commentStore, editor],
  );

  useEffect(() => {
    if (activeIDs.length > 0) {
      setShowComments(true);
    }
  }, [activeIDs]);

  useEffect(() => {
    const markNodeKeysToIDs: Map<NodeKey, Array<string>> = new Map();

    return mergeRegister(
      registerNestedElementResolver<MarkNode>(
        editor,
        MarkNode,
        (from: MarkNode) => {
          return $createMarkNode(from.getIDs());
        },
        (from: MarkNode, to: MarkNode) => {
          // Merge the IDs
          const ids = from.getIDs();
          ids.forEach((id) => {
            to.addID(id);
          });
        },
      ),
      editor.registerMutationListener(
        MarkNode,
        (mutations) => {
          editor.getEditorState().read(() => {
            for (const [key, mutation] of mutations) {
              const node: null | MarkNode = $getNodeByKey(key);
              let ids: NodeKey[] = [];

              if (mutation === 'destroyed') {
                ids = markNodeKeysToIDs.get(key) || [];
              } else if ($isMarkNode(node)) {
                ids = node.getIDs();
              }

              for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                let markNodeKeys = markNodeMap.get(id);
                markNodeKeysToIDs.set(key, ids);

                if (mutation === 'destroyed') {
                  if (markNodeKeys !== undefined) {
                    markNodeKeys.delete(key);
                    if (markNodeKeys.size === 0) {
                      markNodeMap.delete(id);
                    }
                  }
                } else {
                  if (markNodeKeys === undefined) {
                    markNodeKeys = new Set();
                    markNodeMap.set(id, markNodeKeys);
                  }
                  if (!markNodeKeys.has(key)) {
                    markNodeKeys.add(key);
                  }
                }
              }
            }
          });
        },
        {skipInitialization: false},
      ),
      editor.registerUpdateListener(({editorState, tags}) => {
        editorState.read(() => {
          const selection = $getSelection();
          if (!tags.has(COLLABORATION_TAG) && $isRangeSelection(selection)) {
            setShowCommentInput(false);
          }
        });
      }),
      editor.registerCommand(
        INSERT_INLINE_COMMAND,
        () => {
          const domSelection = getDOMSelection(editor._window);
          if (domSelection !== null) {
            domSelection.removeAllRanges();
          }
          setCommentAnchorRect(null);
          setShowCommentInput(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        INSERT_INLINE_COMMENT_AT_COMMAND,
        (payload) => {
          const domSelection = getDOMSelection(editor._window);
          if (domSelection !== null) {
            domSelection.removeAllRanges();
          }
          setCommentAnchorRect(payload.rect);
          setShowCommentInput(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        INSERT_INLINE_THREAD_COMMAND,
        (payload) => {
          let selection = $getSelection();
          if (payload.selectionSnapshot) {
            const snapshotSelection = createRangeSelectionFromSnapshot(
              payload.selectionSnapshot,
            );
            if (snapshotSelection) {
              $setSelection(snapshotSelection);
              selection = snapshotSelection;
            }
          }
          if (!$isRangeSelection(selection)) return false;
          if (selection.isCollapsed()) return false;

          const quote = payload.quote ?? selection.getTextContent();
          const threadId = payload.threadId;

          const existing = commentStore
            .getComments()
            .some((c) => c.type === 'thread' && c.id === threadId);

          if (!existing) {
            const thread = createThread(
              quote,
              [createComment(payload.initialContent, author)],
              threadId,
            );
            commentStore.addComment(thread);
          }

          const isBackward = selection.isBackward();
          // MarkNodes are purely presentational metadata; creating them should not
          // introduce extra undo steps.
          $addUpdateTag(HISTORY_MERGE_TAG);
          $wrapSelectionInMarkNode(selection, isBackward, threadId);

          setShowComments(true);
          setShowCommentInput(false);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        UPDATE_INLINE_THREAD_COMMAND,
        (payload) => {
          commentStore.updateThread(payload.threadId, {
            quote: payload.quote,
            firstCommentContent: payload.firstCommentContent,
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        HIDE_THREAD_COMMAND,
        (payload) => {
          const thread = commentStore
            .getComments()
            .find((c) => c.type === 'thread' && c.id === payload.threadId) as Thread | undefined;
          if (thread) {
            commentStore.deleteCommentOrThread(thread);
          }

          const markNodeKeys = markNodeMap.get(payload.threadId);
          if (markNodeKeys !== undefined) {
            // Important: we don't want deferred mark cleanup to run *after* undo/redo has restored
            // the thread, since that can invalidate selection points. We therefore:
            // - run cleanup as a microtask (so it happens promptly)
            // - and skip cleanup if the thread has been recreated in the meantime.
            queueMicrotask(() => {
              const threadStillAbsent = commentStore
                .getComments()
                .every((c) => c.type !== 'thread' || c.id !== payload.threadId);
              if (!threadStillAbsent) return;

              editor.update(
                () => {
                  // MarkNodes are UI-only metadata; ensure this doesn't create extra Lexical undo steps.
                  $addUpdateTag(HISTORY_MERGE_TAG);
                  // This is derived UI state. It should sync to Yjs so collaborators converge, but
                  // must not be tracked by Yjs UndoManager (or it clears redo).
                  $addUpdateTag('fmDerivedUi');
                  for (const key of markNodeKeys) {
                    const node: null | MarkNode = $getNodeByKey(key);
                    if ($isMarkNode(node)) {
                      node.deleteID(payload.threadId);
                      if (node.getIDs().length === 0) {
                        $unwrapMarkNode(node);
                      }
                    }
                  }
                },
                { tag: HISTORY_MERGE_TAG },
              );
            });
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [author, commentStore, editor, markNodeMap]);

  const onAddComment = () => {
    editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
  };

  return (
    <>
      {showCommentInput &&
        createPortal(
          <CommentInputBox
            editor={editor}
            cancelAddComment={cancelAddComment}
            submitAddComment={submitAddComment}
            anchorRect={commentAnchorRect}
          />,
          document.body,
        )}
      {activeAnchorKey !== null &&
        activeAnchorKey !== undefined &&
        !showCommentInput &&
        createPortal(
          <AddCommentBox
            anchorKey={activeAnchorKey}
            editor={editor}
            onAddComment={onAddComment}
          />,
          document.body,
        )}
      {isPostEditor && createPortal(
        <Button
          className={classNames(classes.showCommentsButton, { [classes.showCommentsButtonActive]: showComments })}
          onClick={() => setShowComments(!showComments)}
          title={showComments ? 'Hide Comments' : 'Show Comments'}>
          <CommentsIcon className={classes.commentsIcon} />
        </Button>,
        document.body,
      )}
      {showComments && isPostEditor &&
        createPortal(
          <CommentsPanel
            comments={[...comments].reverse()}
            submitAddComment={submitAddComment}
            deleteCommentOrThread={deleteCommentOrThread}
            activeIDs={activeIDs}
            markNodeMap={markNodeMap}
          />,
          document.body,
        )}
    </>
  );
}
