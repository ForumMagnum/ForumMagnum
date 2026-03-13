import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { NodeKey } from 'lexical';
import { $getNodeByKey, SKIP_SCROLL_INTO_VIEW_TAG } from 'lexical';
import { $isMarkNode } from '@lexical/mark';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useMarkNodesContext, type MarkNodeMap } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext';
import { useCommentStoreContext, useCommentStore } from '@/components/lexical/commenting/CommentStoreContext';
import type { Thread } from '@/components/lexical/commenting';
import { SideItem, useHasSideItemsSidebar, useSideItemsFocus } from '@/components/contents/SideItems';
import { useLexicalEditorContext } from '@/components/editor/LexicalEditorContext';
import { useIsAboveBreakpoint } from '@/components/hooks/useScreenWidth';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import moment from 'moment';

interface SideCommentData {
  threadId: string;
  anchorEl: HTMLElement;
  thread: Thread;
}

const styles = defineStyles('SideCommentsPlugin', (theme: ThemeType) => ({
  sideComment: {
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.14),
    borderRadius: 8,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out',
    marginBottom: 12,
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.25),
    },
    ...theme.typography.commentStyle,
  },
  sideCommentActive: {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
  threadQuote: {
    margin: 0,
    padding: '8px 12px',
    borderLeft: `3px solid ${theme.palette.grey[300]}`,
    color: theme.palette.grey[600],
    fontSize: 13,
    lineHeight: 1.4,
    fontStyle: 'italic',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
  },
  commentsList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  comment: {
    padding: '8px 12px',
    borderTop: theme.palette.greyBorder('1px', 0.08),
    '&:first-child': {
      borderTop: 'none',
    },
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  commentAuthor: {
    fontWeight: 600,
    fontSize: 12,
    color: theme.palette.grey[900],
  },
  commentTime: {
    fontSize: 11,
    color: theme.palette.grey[500],
  },
  commentContent: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.grey[800],
    whiteSpace: 'pre-wrap',
  },
}));

export function useHasSideComments(): boolean {
  const { isPostEditor } = useLexicalEditorContext();
  const hasSideItemsSidebar = useHasSideItemsSidebar();
  const screenIsWideEnough = useIsAboveBreakpoint('lg');
  return isPostEditor && hasSideItemsSidebar && screenIsWideEnough;
}

function isCommentThread(thread: Thread): boolean {
  return thread.threadType !== 'suggestion';
}

function collectSideComments(
  threads: Thread[],
  markNodeMap: MarkNodeMap,
  editor: { getElementByKey: (key: NodeKey) => HTMLElement | null },
): SideCommentData[] {
  const result: SideCommentData[] = [];
  for (const thread of threads) {
    if (!isCommentThread(thread)) continue;

    const threadId = thread.id;
    const nodeKeys = markNodeMap.get(threadId);
    if (!nodeKeys || nodeKeys.size === 0) continue;

    const firstKey = nodeKeys.values().next().value;
    if (!firstKey) continue;
    const element = editor.getElementByKey(firstKey);
    if (!element) continue;

    result.push({ threadId, anchorEl: element, thread });
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
      prev[i].threadId !== next[i].threadId ||
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
}: {
  data: SideCommentData;
  isActive: boolean;
  onClick: () => void;
}) => {
  const classes = useStyles(styles);
  const { thread } = data;

  return (
    <SideItem anchorEl={data.anchorEl}>
      <div
        className={classNames(
          classes.sideComment,
          isActive && classes.sideCommentActive,
        )}
        onClick={onClick}
      >
        {thread.quote && (
          <blockquote className={classes.threadQuote}>
            {thread.quote}
          </blockquote>
        )}
        <ul className={classes.commentsList}>
          {thread.comments
            .filter((c) => !c.deleted)
            .map((comment) => (
              <li key={comment.id} className={classes.comment}>
                <div className={classes.commentHeader}>
                  <span className={classes.commentAuthor}>{comment.author}</span>
                  <span className={classes.commentTime}>
                    {moment(comment.timeStamp).fromNow()}
                  </span>
                </div>
                <p className={classes.commentContent}>
                  {comment.content}
                </p>
              </li>
            ))}
        </ul>
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
      const activeData = sideComments.find((d) => d.threadId === activeThreadId);
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
      const markNodeKeys = markNodeMap.get(data.threadId);
      if (markNodeKeys && markNodeKeys.size > 0) {
        const markNodeKey = markNodeKeys.values().next().value;
        if (markNodeKey) {
          editor.update(
            () => {
              const markNode = $getNodeByKey(markNodeKey);
              if ($isMarkNode(markNode)) {
                markNode.selectStart();
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
          key={data.threadId}
          data={data}
          isActive={activeIDs.indexOf(data.threadId) !== -1}
          onClick={() => handleClickSideComment(data)}
        />
      ))}
    </>
  );
};
