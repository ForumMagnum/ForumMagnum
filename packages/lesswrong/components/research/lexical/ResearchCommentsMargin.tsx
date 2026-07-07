'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import moment from '@/lib/moment-timezone';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { $isMarkNode, $unwrapMarkNode, MarkNode } from '@lexical/mark';
import { useMarkNodesContext } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext';
import { useCommentStoreContext, useCommentStore } from '@/components/lexical/commenting/CommentStoreContext';
import type { Comment, Thread } from '@/components/lexical/commenting';
import {
  CommentsComposer,
  RESOLVE_THREAD_COMMAND,
  SuggestionStatusOrActions,
  acceptSuggestionThread,
  getThreadMarkId,
  rejectSuggestionThread,
} from '@/components/lexical/plugins/CommentPlugin/CommentPluginComponents';
import { SUGGESTION_SUMMARY_KIND } from '@/components/editor/lexicalPlugins/suggestedEdits/Utils';
import { formatSuggestionSummary } from '@/components/editor/lexicalPlugins/suggestedEdits/suggestionSummaryUtils';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import { useResearchCommentsMarginHostOptional } from './researchCommentsMarginContext';
import { researchMono, researchTransition, researchWarmAlpha, researchCanvas, researchUiSans, researchRadius } from '../researchStyleUtils';

const CARD_GAP = 10;
const DEFAULT_CARD_HEIGHT = 90;

const styles = defineStyles('ResearchCommentsMargin', (theme: ThemeType) => ({
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    background: researchCanvas(theme),
    border: `1px solid ${researchWarmAlpha(0.1)}`,
    borderRadius: researchRadius.sm,
    padding: '8px 10px',
    fontFamily: researchUiSans,
    fontSize: 13,
    lineHeight: 1.45,
    color: theme.palette.text.primary,
    cursor: 'pointer',
    transition: `top 160ms ease, border-color ${researchTransition}, box-shadow ${researchTransition}`,
    '&:hover': {
      borderColor: researchWarmAlpha(0.2),
    },
  },
  cardActive: {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 2px 10px ${researchWarmAlpha(0.08)}`,
  },
  quote: {
    fontFamily: theme.palette.fonts.serifStack,
    fontStyle: 'italic',
    fontSize: 12,
    color: theme.palette.text.dim,
    borderLeft: `2px solid ${researchWarmAlpha(0.15)}`,
    paddingLeft: 7,
    marginBottom: 6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  commentRow: {
    marginBottom: 6,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    minWidth: 0,
  },
  author: {
    fontWeight: 600,
    fontSize: 12.5,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  time: {
    flex: 'none',
    fontFamily: researchMono,
    fontSize: 9.5,
    color: researchWarmAlpha(0.4),
  },
  content: {
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  },
  contentDeleted: {
    color: theme.palette.text.dim,
    fontStyle: 'italic',
  },
  actions: {
    position: 'absolute',
    top: 5,
    right: 6,
    display: 'flex',
    gap: 2,
    opacity: 0,
    transition: `opacity ${researchTransition}`,
    '$card:hover &': {
      opacity: 1,
    },
  },
  actionButton: {
    width: 20,
    height: 20,
    padding: 0,
    border: 'none',
    borderRadius: researchRadius.xs,
    background: researchCanvas(theme),
    color: theme.palette.text.dim,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      color: theme.palette.text.primary,
      background: researchWarmAlpha(0.06),
    },
  },
  actionIcon: {
    '--icon-size': '13px',
  },
  composerWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 6,
    borderTop: `1px solid ${researchWarmAlpha(0.07)}`,
    paddingTop: 6,
    '& [contenteditable="true"]': {
      fontSize: 12.5,
    },
  },
}));

interface ThreadAnchors {
  anchors: Map<string, number>;
}

function computeCardTops(
  orderedThreads: Thread[],
  anchors: Map<string, number>,
  heights: Map<string, number>,
  activeThreadId: string | null,
): Map<string, number> {
  const tops = new Map<string, number>();
  const heightOf = (thread: Thread) => heights.get(thread.id) ?? DEFAULT_CARD_HEIGHT;

  let prevBottom = -CARD_GAP;
  for (const thread of orderedThreads) {
    const desired = anchors.get(thread.id) ?? (prevBottom + CARD_GAP);
    const top = Math.max(desired, prevBottom + CARD_GAP);
    tops.set(thread.id, top);
    prevBottom = top + heightOf(thread);
  }

  const activeIndex = activeThreadId
    ? orderedThreads.findIndex((t) => t.id === activeThreadId)
    : -1;
  if (activeIndex >= 0) {
    const active = orderedThreads[activeIndex];
    const desired = anchors.get(active.id);
    if (desired !== undefined && (tops.get(active.id) ?? 0) > desired) {
      tops.set(active.id, desired);
      let upperLimit = desired;
      for (let i = activeIndex - 1; i >= 0; i--) {
        const thread = orderedThreads[i];
        const maxTop = upperLimit - CARD_GAP - heightOf(thread);
        if ((tops.get(thread.id) ?? 0) > maxTop) tops.set(thread.id, maxTop);
        upperLimit = tops.get(thread.id) ?? maxTop;
      }
      let bottom = desired + heightOf(active);
      for (let i = activeIndex + 1; i < orderedThreads.length; i++) {
        const thread = orderedThreads[i];
        const desiredI = anchors.get(thread.id) ?? (bottom + CARD_GAP);
        const top = Math.max(desiredI, bottom + CARD_GAP);
        tops.set(thread.id, top);
        bottom = top + heightOf(thread);
      }
    }
  }

  return tops;
}

export default function ResearchCommentsMargin() {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const host = useResearchCommentsMarginHostOptional();
  const { commentStore } = useCommentStoreContext();
  const comments = useCommentStore(commentStore);
  const { markNodeMap, activeIDs } = useMarkNodesContext();

  const [anchorState, setAnchorState] = useState<ThreadAnchors>({ anchors: new Map() });
  const [cardHeights, setCardHeights] = useState<Map<string, number>>(new Map());
  const cardElsRef = useRef(new Map<string, HTMLElement>());

  // Threads of BOTH kinds: comment threads and suggestion threads. With the
  // side-comments plugin gated off for research docs and the docked panel
  // retired, the margin is the only surface carrying the suggestion
  // accept/reject actions — filtering suggestions out left them unresolvable.
  const openThreads = useMemo(
    () =>
      comments.filter(
        (c): c is Thread => c.type === 'thread' && c.status !== 'archived',
      ),
    [comments],
  );

  const setOpenThreadCount = host?.setOpenThreadCount;
  useEffect(() => {
    setOpenThreadCount?.(openThreads.length);
    return () => setOpenThreadCount?.(0);
  }, [openThreads.length, setOpenThreadCount]);

  const portalContainer = host?.portalContainer ?? null;
  const measureAnchors = useCallback(() => {
    if (!portalContainer) return;
    const containerRect = portalContainer.getBoundingClientRect();
    const next = new Map<string, number>();
    for (const thread of openThreads) {
      const markId = getThreadMarkId(thread);
      const keys = markNodeMap.get(markId);
      const firstKey = keys ? keys.values().next().value : undefined;
      const el = firstKey ? editor.getElementByKey(firstKey) : null;
      if (el) {
        next.set(thread.id, el.getBoundingClientRect().top - containerRect.top);
      }
    }
    setAnchorState((prev) => {
      if (prev.anchors.size === next.size) {
        let same = true;
        for (const [id, top] of next) {
          if (Math.abs((prev.anchors.get(id) ?? Infinity) - top) > 0.5) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return { anchors: next };
    });
  }, [portalContainer, openThreads, markNodeMap, editor]);

  useLayoutEffect(() => {
    measureAnchors();
    let scheduledFrame: number | null = null;
    const scheduleMeasure = () => {
      if (scheduledFrame !== null) return;
      scheduledFrame = requestAnimationFrame(() => {
        scheduledFrame = null;
        measureAnchors();
      });
    };
    const removeUpdateListener = editor.registerUpdateListener(scheduleMeasure);
    const rootEl = editor.getRootElement();
    const observer = new ResizeObserver(scheduleMeasure);
    if (rootEl) observer.observe(rootEl);
    return () => {
      removeUpdateListener();
      observer.disconnect();
      if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
    };
  }, [editor, measureAnchors]);

  const heightObserverRef = useRef<ResizeObserver | null>(null);
  if (heightObserverRef.current === null && typeof ResizeObserver !== 'undefined') {
    heightObserverRef.current = new ResizeObserver((entries) => {
      setCardHeights((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const entry of entries) {
          const threadId = (entry.target as HTMLElement).dataset.threadId;
          if (!threadId) continue;
          const height = entry.target.getBoundingClientRect().height;
          if (Math.abs((next.get(threadId) ?? 0) - height) > 0.5) {
            next.set(threadId, height);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });
  }
  useEffect(() => () => heightObserverRef.current?.disconnect(), []);

  const registerCardEl = useCallback((threadId: string, el: HTMLElement | null) => {
    const existing = cardElsRef.current.get(threadId);
    if (existing && existing !== el) heightObserverRef.current?.unobserve(existing);
    if (el) {
      cardElsRef.current.set(threadId, el);
      el.dataset.threadId = threadId;
      heightObserverRef.current?.observe(el);
    } else {
      cardElsRef.current.delete(threadId);
    }
  }, []);

  const orderedThreads = useMemo(() => {
    const withAnchors = openThreads.filter((t) => anchorState.anchors.has(t.id));
    return withAnchors.sort(
      (a, b) => (anchorState.anchors.get(a.id) ?? 0) - (anchorState.anchors.get(b.id) ?? 0),
    );
  }, [openThreads, anchorState]);

  const activeThreadId = useMemo(() => {
    for (const thread of orderedThreads) {
      if (activeIDs.includes(getThreadMarkId(thread))) return thread.id;
    }
    return null;
  }, [orderedThreads, activeIDs]);

  const cardTops = useMemo(
    () => computeCardTops(orderedThreads, anchorState.anchors, cardHeights, activeThreadId),
    [orderedThreads, anchorState, cardHeights, activeThreadId],
  );

  const scrollToMark = useCallback((thread: Thread) => {
    const keys = markNodeMap.get(getThreadMarkId(thread));
    const firstKey = keys ? keys.values().next().value : undefined;
    const el = firstKey ? editor.getElementByKey(firstKey) : null;
    el?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [editor, markNodeMap]);

  const resolveThread = useCallback((thread: Thread) => {
    editor.dispatchCommand(RESOLVE_THREAD_COMMAND, {
      threadId: thread.id,
      markId: getThreadMarkId(thread),
    });
  }, [editor]);

  // Suggestion resolution is accept/reject (the suggestion machinery applies
  // or reverts the proposed edit), not the comment-thread resolve.
  const acceptSuggestion = useCallback(
    (thread: Thread) => acceptSuggestionThread(editor, thread),
    [editor],
  );
  const rejectSuggestion = useCallback(
    (thread: Thread) => rejectSuggestionThread(editor, thread),
    [editor],
  );

  const deleteThread = useCallback((thread: Thread) => {
    commentStore.deleteCommentOrThread(thread);
    const markNodeKeys = markNodeMap.get(getThreadMarkId(thread));
    if (markNodeKeys !== undefined) {
      editor.update(() => {
        for (const key of markNodeKeys) {
          const node: null | MarkNode = $getNodeByKey(key);
          if ($isMarkNode(node)) {
            node.deleteID(getThreadMarkId(thread));
            if (node.getIDs().length === 0) {
              $unwrapMarkNode(node);
            }
          }
        }
      });
    }
  }, [commentStore, editor, markNodeMap]);

  const submitReply = useCallback(
    (comment: Comment, _isInlineComment: boolean, thread?: Thread) => {
      commentStore.addComment(comment, thread);
    },
    [commentStore],
  );

  if (!portalContainer || orderedThreads.length === 0) return null;

  return createPortal(
    <>
      {orderedThreads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          top={cardTops.get(thread.id) ?? 0}
          active={thread.id === activeThreadId}
          registerCardEl={registerCardEl}
          onJumpToMark={scrollToMark}
          onResolve={resolveThread}
          onDelete={deleteThread}
          onAcceptSuggestion={acceptSuggestion}
          onRejectSuggestion={rejectSuggestion}
          submitReply={submitReply}
        />
      ))}
    </>,
    portalContainer,
  );
}

function ThreadCard({
  thread,
  top,
  active,
  registerCardEl,
  onJumpToMark,
  onResolve,
  onDelete,
  onAcceptSuggestion,
  onRejectSuggestion,
  submitReply,
}: {
  thread: Thread;
  top: number;
  active: boolean;
  registerCardEl: (threadId: string, el: HTMLElement | null) => void;
  onJumpToMark: (thread: Thread) => void;
  onResolve: (thread: Thread) => void;
  onDelete: (thread: Thread) => void;
  onAcceptSuggestion: (thread: Thread) => void;
  onRejectSuggestion: (thread: Thread) => void;
  submitReply: (comment: Comment, isInlineComment: boolean, thread?: Thread) => void;
}) {
  const classes = useStyles(styles);
  const refCallback = useCallback(
    (el: HTMLElement | null) => registerCardEl(thread.id, el),
    [registerCardEl, thread.id],
  );

  // Suggestion threads carry the proposed edit as a machine-written summary
  // comment; it renders as the card body and its author heads the card. The
  // actions are accept/reject (permission-gated inside
  // SuggestionStatusOrActions) instead of resolve/delete — deleting a
  // suggestion thread without rejecting would orphan its suggestion nodes.
  const isSuggestion = thread.threadType === 'suggestion';
  const summaryComment = isSuggestion
    ? thread.comments.find((c) => c.commentKind === SUGGESTION_SUMMARY_KIND)
    : undefined;
  const summaryText = useMemo(
    () => (summaryComment?.content ? formatSuggestionSummary(summaryComment.content) : null),
    [summaryComment?.content],
  );
  const visibleComments = thread.comments.filter(
    (c) => c.commentKind !== SUGGESTION_SUMMARY_KIND,
  );

  return (
    <div
      ref={refCallback}
      className={classNames(classes.card, active && classes.cardActive)}
      style={{ top }}
      onClick={() => onJumpToMark(thread)}
    >
      <div className={classes.actions}>
        {isSuggestion ? (
          <div onClick={(e) => e.stopPropagation()}>
            <SuggestionStatusOrActions
              status={thread.status ?? 'open'}
              suggestionAuthorId={summaryComment?.authorId}
              onAccept={() => onAcceptSuggestion(thread)}
              onReject={() => onRejectSuggestion(thread)}
            />
          </div>
        ) : (
          <>
            <button
              type="button"
              className={classes.actionButton}
              onClick={(e) => { e.stopPropagation(); onResolve(thread); }}
              title="Resolve thread"
              aria-label="Resolve thread"
            >
              <ForumIcon icon="Check" className={classes.actionIcon} />
            </button>
            <button
              type="button"
              className={classes.actionButton}
              onClick={(e) => { e.stopPropagation(); onDelete(thread); }}
              title="Delete thread"
              aria-label="Delete thread"
            >
              <ForumIcon icon="Close" className={classes.actionIcon} />
            </button>
          </>
        )}
      </div>
      {isSuggestion && summaryComment ? (
        <div className={classes.commentRow}>
          <div className={classes.commentHeader}>
            <span className={classes.author}>{summaryComment.author}</span>
            <span className={classes.time}>{moment(summaryComment.timeStamp).fromNow()}</span>
          </div>
          {summaryText ? <div className={classes.content}>{summaryText}</div> : null}
        </div>
      ) : null}
      {thread.quote ? <div className={classes.quote}>{thread.quote}</div> : null}
      {visibleComments.map((comment) => (
        <div key={comment.id} className={classes.commentRow}>
          <div className={classes.commentHeader}>
            <span className={classes.author}>{comment.author}</span>
            <span className={classes.time}>{moment(comment.timeStamp).fromNow()}</span>
          </div>
          <div className={classNames(classes.content, comment.deleted && classes.contentDeleted)}>
            {comment.content}
          </div>
        </div>
      ))}
      <div className={classes.composerWrap} onClick={(e) => e.stopPropagation()}>
        <CommentsComposer
          submitAddComment={submitReply}
          thread={thread}
          placeholder="Reply…"
        />
      </div>
    </div>
  );
}
