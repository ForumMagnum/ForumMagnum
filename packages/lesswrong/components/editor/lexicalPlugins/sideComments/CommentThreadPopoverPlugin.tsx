import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { LexicalEditor } from 'lexical';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, KEY_ESCAPE_COMMAND } from 'lexical';
import { createDOMRange } from '@lexical/selection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { State } from '@popperjs/core/lib/types';
import { useMarkNodesContext, type MarkNodeMap } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext';
import { useCommentStoreContext, useCommentStore } from '@/components/lexical/commenting/CommentStoreContext';
import type { Comments, Comment, Thread } from '@/components/lexical/commenting';
import { RESOLVE_THREAD_COMMAND, getThreadMarkId } from '@/components/lexical/plugins/CommentPlugin/CommentPluginComponents';
import { InlineCommentsPanelContext } from '@/components/common/sharedContexts';
import LWPopper from '@/components/common/LWPopper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useHasSideComments } from './SideCommentsPlugin';
import { CommentThreadCard } from './CommentThreadCard';

const styles = defineStyles('CommentThreadPopoverPlugin', (theme: ThemeType) => ({
  popover: {
    width: 'min(340px, calc(100vw - 16px))',
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.14),
    borderRadius: 8,
    boxShadow: `0 4px 16px ${theme.palette.boxShadowColor(0.15)}`,
    overflow: 'hidden',
  },
  commentsList: {
    maxHeight: 'min(260px, 40vh)',
    overflowY: 'auto',
  },
}));

/**
 * If the commented range is taller than this fraction of the viewport, anchor
 * the popover to the cursor's line rather than to the whole range, so that it
 * isn't placed off-screen.
 */
const MAX_RANGE_ANCHOR_HEIGHT_FRACTION = 1 / 3;

interface VirtualAnchor {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
}

function findActiveThread(comments: Comments, activeIDs: string[]): Thread | null {
  for (const id of activeIDs) {
    const thread = comments.find((c): c is Thread => (
      c.type === 'thread'
      && (c.status ?? 'open') === 'open'
      && getThreadMarkId(c) === id
    ));
    if (thread) return thread;
  }
  return null;
}

function getMarkElements(editor: LexicalEditor, markNodeMap: MarkNodeMap, markId: string): HTMLElement[] {
  const elements: HTMLElement[] = [];
  for (const key of markNodeMap.get(markId) ?? []) {
    const element = editor.getElementByKey(key);
    if (element) elements.push(element);
  }
  return elements;
}

function getUnionRect(elements: HTMLElement[]): DOMRect | null {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  if (left === Infinity) return null;
  return new DOMRect(left, top, right - left, bottom - top);
}

/**
 * The rect of the editor's (lexical) cursor position. This is derived from the
 * editor state rather than the DOM selection, so it stays put while focus is
 * in the popover's reply box.
 */
function getCaretRect(editor: LexicalEditor): DOMRect | null {
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    const { focus } = selection;
    const range = createDOMRange(editor, focus.getNode(), focus.offset, focus.getNode(), focus.offset);
    const rect = range?.getBoundingClientRect();
    return rect && rect.height > 0 ? rect : null;
  });
}

function getThreadAnchorRect(editor: LexicalEditor, markNodeMap: MarkNodeMap, markId: string): DOMRect {
  const rangeRect = getUnionRect(getMarkElements(editor, markNodeMap, markId));
  if (!rangeRect || rangeRect.height > window.innerHeight * MAX_RANGE_ANCHOR_HEIGHT_FRACTION) {
    const caretRect = getCaretRect(editor);
    if (caretRect) {
      return rangeRect
        ? new DOMRect(rangeRect.left, caretRect.top, rangeRect.width, caretRect.height)
        : caretRect;
    }
  }
  return rangeRect ?? new DOMRect();
}

/**
 * A popper "virtual element" for a thread's commented range. It's measured
 * lazily, whenever popper repositions.
 */
function createThreadAnchor(editor: LexicalEditor, markNodeMap: MarkNodeMap, markId: string): VirtualAnchor {
  return {
    getBoundingClientRect: () => getThreadAnchorRect(editor, markNodeMap, markId),
    // Lets popper find the scroll containers to listen to
    contextElement: editor.getRootElement() ?? undefined,
  };
}

/**
 * When the side-comments margin isn't available (ie at narrower screen
 * widths), shows the comment thread for the commented range that the cursor is
 * in, in a tooltip-like popover under that range. (At wider widths, the
 * corresponding side comment is highlighted instead.) Hidden while the
 * all-comments panel is open, and can be dismissed with Escape.
 */
export const CommentThreadPopoverPlugin = () => {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const { markNodeMap, activeIDs } = useMarkNodesContext();
  const { commentStore } = useCommentStoreContext();
  const comments = useCommentStore(commentStore);
  const hasSideComments = useHasSideComments();
  const { showComments } = useContext(InlineCommentsPanelContext);
  const [dismissedMarkId, setDismissedMarkId] = useState<string|null>(null);
  const updatePopperRef = useRef<(() => Promise<Partial<State>>) | null | undefined>(null);

  const activeThread = useMemo(() => findActiveThread(comments, activeIDs), [comments, activeIDs]);
  const activeMarkId = activeThread ? getThreadMarkId(activeThread) : null;

  const anchor = useMemo(
    () => activeMarkId ? createThreadAnchor(editor, markNodeMap, activeMarkId) : null,
    [editor, markNodeMap, activeMarkId],
  );

  const isOpen = !!activeThread
    && !!anchor
    && !hasSideComments
    && !showComments
    && activeMarkId !== dismissedMarkId;

  // A dismissal only lasts until the cursor leaves that thread's range
  useEffect(() => {
    setDismissedMarkId((prev) => (prev !== null && prev !== activeMarkId) ? null : prev);
  }, [activeMarkId]);

  useEffect(() => {
    if (!isOpen || !activeMarkId) return;
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setDismissedMarkId(activeMarkId);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, isOpen, activeMarkId]);

  // Edits can move or resize the commented range, so reposition after each
  // update. (Popper handles scrolling and window resizes itself.)
  useEffect(() => {
    if (!isOpen) return;
    return editor.registerUpdateListener(() => {
      void updatePopperRef.current?.();
    });
  }, [editor, isOpen]);

  const submitAddComment = useCallback(
    (comment: Comment, _isInlineComment: boolean, thread?: Thread) => {
      commentStore.addComment(comment, thread);
    },
    [commentStore],
  );

  const handleResolve = useCallback(() => {
    if (!activeThread) return;
    editor.dispatchCommand(RESOLVE_THREAD_COMMAND, {
      threadId: activeThread.id,
      markId: getThreadMarkId(activeThread),
    });
  }, [editor, activeThread]);

  if (!activeThread) {
    return null;
  }

  return (
    <LWPopper
      open={isOpen}
      anchorEl={anchor}
      placement="bottom-start"
      distance={6}
      flip
      preventOverflowOnBothAxes
      overflowPadding={8}
      updateRef={updatePopperRef}
    >
      <div className={classes.popover}>
        <CommentThreadCard
          key={activeThread.id}
          thread={activeThread}
          showReplyComposer
          alwaysShowActions
          submitAddComment={submitAddComment}
          onResolve={handleResolve}
          commentsListClassName={classes.commentsList}
        />
      </div>
    </LWPopper>
  );
};
