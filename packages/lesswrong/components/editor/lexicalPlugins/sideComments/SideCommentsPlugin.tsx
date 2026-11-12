import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { NodeKey } from 'lexical';
import { $getNodeByKey, SKIP_SCROLL_INTO_VIEW_TAG } from 'lexical';
import { $isMarkNode } from '@lexical/mark';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useMarkNodesContext, type MarkNodeMap } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext';
import { useCommentStoreContext, useCommentStore } from '@/components/lexical/commenting/CommentStoreContext';
import type { Thread, Comment } from '@/components/lexical/commenting';
import { $isSuggestionNode } from '@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode';
import { SuggestionTypesThatCanBeEmpty } from '@/components/editor/lexicalPlugins/suggestedEdits/Types';
import { RESOLVE_THREAD_COMMAND, getThreadMarkId } from '@/components/lexical/plugins/CommentPlugin/CommentPluginComponents';
import { CommentThreadCard } from './CommentThreadCard';
import { SideItem, useHasSideItemsSidebar, useSideItemsFocus } from '@/components/contents/SideItems';
import { useLexicalEditorContext } from '@/components/editor/LexicalEditorContext';
import { useIsAboveBreakpoint } from '@/components/hooks/useScreenWidth';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

interface SideCommentData {
  /** The ID used to look up this thread's mark nodes in markNodeMap */
  markId: string;
  anchorEl: HTMLElement;
  thread: Thread;
}

const styles = defineStyles('SideCommentsPlugin', (theme: ThemeType) => ({
  sideComment: {
    backgroundColor: theme.palette.type === 'light' ? theme.palette.panelBackground.darken05 : theme.palette.panelBackground.darken08,
    borderRadius: 5,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-in-out',
    marginBottom: 12,
    '&$sideCommentActive': {
      cursor: 'auto',
    },
    '&:hover': {
      backgroundColor: theme.palette.type === 'light' ? theme.palette.panelBackground.darken08 : theme.palette.panelBackground.darken15,
    },
  },
  sideCommentActive: {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
}));

export function useHasSideComments(): boolean {
  const { supportsCollabComments } = useLexicalEditorContext();
  const hasSideItemsSidebar = useHasSideItemsSidebar();
  const screenIsWideEnough = useIsAboveBreakpoint('lg');
  return supportsCollabComments && hasSideItemsSidebar && screenIsWideEnough;
}

function collectSideComments(
  threads: Thread[],
  markNodeMap: MarkNodeMap,
  editor: { getElementByKey: (key: NodeKey) => HTMLElement | null },
): SideCommentData[] {
  const result: SideCommentData[] = [];
  for (const thread of threads) {
    // Skip non-open threads (resolved/rejected suggestions)
    if ((thread.status ?? 'open') !== 'open') continue;

    const markId = getThreadMarkId(thread);
    const nodeKeys = markNodeMap.get(markId);
    if (!nodeKeys || nodeKeys.size === 0) continue;

    const firstKey = nodeKeys.values().next().value;
    if (!firstKey) continue;
    const element = editor.getElementByKey(firstKey);
    if (!element) continue;

    result.push({ markId, anchorEl: element, thread });
  }
  return result;
}

function sideCommentsAreEqual(
  prev: SideCommentData[],
  next: SideCommentData[],
): boolean {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (
      prev[i].markId !== next[i].markId ||
      prev[i].anchorEl !== next[i].anchorEl ||
      prev[i].thread !== next[i].thread
    ) {
      return false;
    }
  }
  return true;
}

const SCROLL_MARGIN = 60;

/**
 * Scrolls the minimum amount needed to make an element visible in the viewport
 * with at least SCROLL_MARGIN pixels of clearance from the top and bottom edges.
 * Does nothing if the element already satisfies that constraint.
 */
function scrollAnchorIntoViewIfNeeded(anchorEl: HTMLElement): void {
  const rect = anchorEl.getBoundingClientRect();
  if (rect.top >= SCROLL_MARGIN && rect.bottom <= window.innerHeight - SCROLL_MARGIN) {
    return;
  }
  if (rect.top < SCROLL_MARGIN) {
    window.scrollBy({ top: rect.top - SCROLL_MARGIN, behavior: 'smooth' });
  } else {
    window.scrollBy({ top: rect.bottom - (window.innerHeight - SCROLL_MARGIN), behavior: 'smooth' });
  }
}

const SideCommentItem = ({
  data,
  isActive,
  onClick,
  submitAddComment,
  onResolve,
}: {
  data: SideCommentData;
  isActive: boolean;
  onClick: () => void;
  submitAddComment: (comment: Comment, isInlineComment: boolean, thread?: Thread) => void;
  onResolve: () => void;
}) => {
  const classes = useStyles(styles);

  return (
    <SideItem anchorEl={data.anchorEl}>
      <div
        className={classNames(
          classes.sideComment,
          isActive && classes.sideCommentActive,
        )}
        onClick={isActive ? undefined : onClick}
      >
        <CommentThreadCard
          thread={data.thread}
          showReplyComposer={isActive}
          submitAddComment={submitAddComment}
          onResolve={onResolve}
        />
      </div>
    </SideItem>
  );
};

export const SideCommentsPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const { markNodeMap, activeIDs } = useMarkNodesContext();
  const { commentStore } = useCommentStoreContext();
  const comments = useCommentStore(commentStore);
  const setFocusedAnchor = useSideItemsFocus();
  const shouldShow = useHasSideComments();

  const [sideComments, setSideComments] = useState<SideCommentData[]>([]);

  // Extract threads from comments
  const threads = useMemo(
    () => comments.filter((c): c is Thread => c.type === 'thread'),
    [comments],
  );

  useEffect(() => {
    if (!shouldShow) {
      setSideComments((prev) => (prev.length ? [] : prev));
      return;
    }

    const refresh = () => {
      const next = collectSideComments(threads, markNodeMap, editor);
      setSideComments((prev) => (sideCommentsAreEqual(prev, next) ? prev : next));
    };

    refresh();
    return mergeRegister(
      editor.registerUpdateListener(() => {
        refresh();
      }),
      editor.registerRootListener(() => {
        refresh();
      }),
    );
  }, [editor, shouldShow, threads, markNodeMap]);

  // When activeIDs changes (user clicked a mark in the editor or selection
  // was moved to a mark via a side comment click), focus the corresponding
  // side comment so it aligns with its anchor text. When activeIDs clears
  // (user clicked away from any mark), clear focus so comments animate back
  // to their default positions.
  useEffect(() => {
    if (!setFocusedAnchor || !shouldShow) return;

    if (activeIDs.length > 0) {
      const activeThreadId = activeIDs[0];
      const activeData = sideComments.find((d) => d.markId === activeThreadId);
      if (activeData) {
        setFocusedAnchor(activeData.anchorEl);
        return;
      }
    }
    setFocusedAnchor(null);
  }, [activeIDs, sideComments, setFocusedAnchor, shouldShow]);

  // Clear focus on unmount
  useEffect(() => {
    return () => {
      setFocusedAnchor?.(null);
    };
  }, [setFocusedAnchor]);

  const handleResolveThread = useCallback(
    (thread: Thread) => {
      editor.dispatchCommand(RESOLVE_THREAD_COMMAND, {
        threadId: thread.id,
        markId: getThreadMarkId(thread),
      });
    },
    [editor],
  );

  const submitAddComment = useCallback(
    (comment: Comment, _isInlineComment: boolean, thread?: Thread) => {
      commentStore.addComment(comment, thread);
    },
    [commentStore],
  );

  const handleClickSideComment = useCallback(
    (data: SideCommentData) => {
      if (!setFocusedAnchor) return;

      // Immediately set focus for relayout
      setFocusedAnchor(data.anchorEl);

      // Scroll anchor into view with margin
      scrollAnchorIntoViewIfNeeded(data.anchorEl);

      // Move editor selection to the start of the mark, which will update
      // activeIDs and make the focus state symmetric — clicking away from
      // the mark in the editor will naturally clear activeIDs and focus.
      const markNodeKeys = markNodeMap.get(data.markId);
      if (markNodeKeys && markNodeKeys.size > 0) {
        const markNodeKey = markNodeKeys.values().next().value;
        if (markNodeKey) {
          editor.update(
            () => {
              const markNode = $getNodeByKey(markNodeKey);
              if ($isMarkNode(markNode)) {
                markNode.selectStart();
              } else if ($isSuggestionNode(markNode)) {
                const suggestionType = markNode.getSuggestionTypeOrThrow();
                if (SuggestionTypesThatCanBeEmpty.includes(suggestionType)) {
                  markNode.getParent()?.selectEnd();
                } else {
                  markNode.selectStart();
                }
              }
            },
            { tag: SKIP_SCROLL_INTO_VIEW_TAG },
          );
        }
      }
    },
    [editor, markNodeMap, setFocusedAnchor],
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      {sideComments.map((data) => (
        <SideCommentItem
          key={data.markId}
          data={data}
          isActive={activeIDs.indexOf(data.markId) !== -1}
          onClick={() => handleClickSideComment(data)}
          submitAddComment={submitAddComment}
          onResolve={() => handleResolveThread(data.thread)}
        />
      ))}
    </>
  );
};
