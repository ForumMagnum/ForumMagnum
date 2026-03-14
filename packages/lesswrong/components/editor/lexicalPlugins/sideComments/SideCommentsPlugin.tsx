import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { LexicalEditor, NodeKey } from 'lexical';
import { $getNodeByKey, SKIP_SCROLL_INTO_VIEW_TAG } from 'lexical';
import { $isMarkNode } from '@lexical/mark';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useMarkNodesContext, type MarkNodeMap } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext';
import { useCommentStoreContext, useCommentStore } from '@/components/lexical/commenting/CommentStoreContext';
import type { Thread, Comment } from '@/components/lexical/commenting';
import { $isSuggestionNode } from '@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode';
import { SuggestionTypesThatCanBeEmpty } from '@/components/editor/lexicalPlugins/suggestedEdits/Types';
import { SUGGESTION_SUMMARY_KIND } from '@/components/editor/lexicalPlugins/suggestedEdits/Utils';
import { formatSuggestionSummary } from '@/components/editor/lexicalPlugins/suggestedEdits/suggestionSummaryUtils';
import { ACCEPT_SUGGESTION_COMMAND, REJECT_SUGGESTION_COMMAND } from '@/components/editor/lexicalPlugins/suggestedEdits/Commands';
import { CommentsComposer, SuggestionStatusOrActions } from '@/components/lexical/plugins/CommentPlugin/CommentPluginComponents';
import { SideItem, useHasSideItemsSidebar, useSideItemsFocus } from '@/components/contents/SideItems';
import { useLexicalEditorContext } from '@/components/editor/LexicalEditorContext';
import { useIsAboveBreakpoint } from '@/components/hooks/useScreenWidth';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import moment from 'moment';

interface SideCommentData {
  /** The ID used to look up this thread's mark nodes in markNodeMap */
  markId: string;
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
  suggestionContent: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.grey[800],
    whiteSpace: 'pre-wrap',
    fontStyle: 'italic',
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
  commentHeaderWithActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  commentHeaderLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    minWidth: 0,
  },
  replyComposer: {
    position: 'relative',
    borderTop: theme.palette.greyBorder('1px', 0.08),
  },
}));

export function useHasSideComments(): boolean {
  const { isPostEditor } = useLexicalEditorContext();
  const hasSideItemsSidebar = useHasSideItemsSidebar();
  const screenIsWideEnough = useIsAboveBreakpoint('lg');
  return isPostEditor && hasSideItemsSidebar && screenIsWideEnough;
}

function getThreadMarkId(thread: Thread): string {
  return thread.threadType === 'suggestion'
    ? (thread.markID ?? thread.id)
    : thread.id;
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

function acceptSuggestionThread(editor: LexicalEditor, thread: Thread): void {
  editor.dispatchCommand(ACCEPT_SUGGESTION_COMMAND, getThreadMarkId(thread));
}

function rejectSuggestionThread(editor: LexicalEditor, thread: Thread): void {
  editor.dispatchCommand(REJECT_SUGGESTION_COMMAND, getThreadMarkId(thread));
}

const SideCommentItem = ({
  data,
  isActive,
  onClick,
  submitAddComment,
}: {
  data: SideCommentData;
  isActive: boolean;
  onClick: () => void;
  submitAddComment: (comment: Comment, isInlineComment: boolean, thread?: Thread) => void;
}) => {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const { thread } = data;
  const isSuggestion = thread.threadType === 'suggestion';

  const summaryComment = isSuggestion
    ? thread.comments.find((c) => c.commentKind === SUGGESTION_SUMMARY_KIND)
    : undefined;
  const summaryText = useMemo(
    () => summaryComment ? formatSuggestionSummary(summaryComment.content) : null,
    [summaryComment],
  );

  const visibleComments = thread.comments.filter(
    (c) => !c.deleted && c.commentKind !== SUGGESTION_SUMMARY_KIND,
  );

  const suggestionStatus = thread.status ?? 'open';

  return (
    <SideItem anchorEl={data.anchorEl}>
      <div
        className={classNames(
          classes.sideComment,
          isActive && classes.sideCommentActive,
        )}
        onClick={onClick}
      >
        {isSuggestion && summaryComment && (
          <div className={classes.comment}>
            <div className={classes.commentHeaderWithActions}>
              <div className={classes.commentHeaderLeft}>
                <span className={classes.commentAuthor}>{summaryComment.author}</span>
                <span className={classes.commentTime}>
                  {moment(summaryComment.timeStamp).fromNow()}
                </span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <SuggestionStatusOrActions
                  status={suggestionStatus}
                  suggestionAuthorId={summaryComment.authorId}
                  onAccept={() => acceptSuggestionThread(editor, thread)}
                  onReject={() => rejectSuggestionThread(editor, thread)}
                />
              </div>
            </div>
            {summaryText && (
              <p className={classes.suggestionContent}>{summaryText}</p>
            )}
          </div>
        )}
        <ul className={classes.commentsList}>
          {visibleComments.map((comment) => (
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
        {isActive && (
          <div className={classes.replyComposer} onClick={(e) => e.stopPropagation()}>
            <CommentsComposer
              submitAddComment={submitAddComment}
              thread={thread}
              placeholder="Reply..."
            />
          </div>
        )}
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
        />
      ))}
    </>
  );
};
