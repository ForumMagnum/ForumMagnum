import { useForumType } from '@/components/hooks/useForumType';
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import { useFilteredCurrentUser } from '../common/withUser';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents"
import { CommentTreeNode, commentTreesEqual, flattenCommentBranch } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import CommentFrame, { HIGHLIGHT_DURATION } from './CommentFrame';
import { scrollFocusOnElement } from '@/lib/scrollUtils';
import { commentPermalinkStyleSetting } from '@/lib/instanceSettings';
import { useCommentLinkState } from './CommentsItem/useCommentLink';
import SingleLineComment from "./SingleLineComment";
import CommentsItem from "./CommentsItem/CommentsItem";
import RepliesToCommentList from "../shortform/RepliesToCommentList";
import AnalyticsTracker from "../common/AnalyticsTracker";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import AnimatedExpansion from '../common/AnimatedExpansion';
import AnimatedCollapse from '../common/AnimatedCollapse';

/**
 * Comments with karma below this threshold start out collapsed to a single
 * line, with their replies hidden.
 */
const KARMA_COLLAPSE_THRESHOLD = -4;

export const COMMENT_DRAFT_TREE_OPTIONS: CommentTreeOptions = {
  condensed: true,
  hideSingleLineMeta: true,
  forceSingleLine: true,
  showCollapseButtons: true,
  initialShowEdit: true,
  hideReply: true
};

const styles = defineStyles('CommentsNode', (theme: ThemeType) => ({
  parentScroll: {
    position: "absolute",
    top:0,
    left:0,
    width:8,
    height:"100%",
    cursor:"pointer",
    '&:hover': {
      backgroundColor: theme.palette.commentParentScrollerHover,
    }
  },
  children: {
    position: "relative"
  },
  gapIndicator: {
    border: theme.palette.border.commentBorder,
    backgroundColor: theme.palette.grey[100],
    marginLeft: 8,
    paddingTop: 8,
  },
}))

export interface CommentsNodeProps {
  treeOptions: CommentTreeOptions,
  comment: CommentsList & {gapIndicator?: boolean},
  startThreadTruncated?: boolean,
  truncated?: boolean,
  shortform?: any,
  nestingLevel?: number,
  expandAllThreads?: boolean,
  /**
   * Determines whether this specific comment is expanded, without passing that
   * expanded state to child comments
   */
  forceUnTruncated?: boolean,
  /**
   * If set, this comment does not start out collapsed to a single line because
   * of low karma or being deleted. Not passed to child comments.
   */
  forceUnCollapsed?: boolean,
  expandNewComments?: boolean,
  isChild?: boolean,
  parentAnswerId?: string|null,
  parentCommentId?: string,
  showExtraChildrenButton?: any,
  hoverPreview?: boolean,
  childComments?: Array<CommentTreeNode<CommentsList>>,
  loadChildrenSeparately?: boolean,
  loadDirectReplies?: boolean,
  showPinnedOnProfile?: boolean,
  enableGuidelines?: boolean,
  /**
   * Determines whether to expand this comment's parent comment (if it exists) by default.
   * 
   * Default: false.  Currently only used in the comment moderation tab.
   */
  showParentDefault?: boolean,
  noAutoScroll?: boolean,
  displayTagIcon?: boolean,
  className?: string,
}
/**
 * CommentsNode: A node in a comment tree, passes through to CommentsItems to handle rendering a specific comment,
 * recurses to handle reply comments in the tree
 *
 * Before adding more props to this, consider whether you should instead be adding a field to the CommentTreeOptions interface.
 */
const CommentsNodeInner = ({treeOptions, comment, startThreadTruncated, truncated, shortform, nestingLevel=1, expandAllThreads, forceUnTruncated, forceUnCollapsed, expandNewComments=true, isChild, parentAnswerId, parentCommentId, showExtraChildrenButton, hoverPreview, childComments, loadChildrenSeparately, loadDirectReplies=false, showPinnedOnProfile=false, enableGuidelines=true, showParentDefault=false, noAutoScroll=false, displayTagIcon=false, className}: CommentsNodeProps) => {
  const { forumType } = useForumType();
  const classes = useStyles(styles);
  const currentUserNoSingleLineCommentsSetting = useFilteredCurrentUser(u => u?.noSingleLineComments);
  const { captureEvent } = useTracking()
  const scrollTargetRef = useRef<HTMLDivElement|null>(null);
  // Height of the comment before it was expanded or collapsed, so the change can be animated
  const heightBeforeResizeRef = useRef<number|null>(null);
  // Whether the comment was collapsed with its [-] button (as opposed to
  // starting out collapsed), in which case the single line appears under the
  // mouse cursor and shouldn't immediately show its hover preview.
  const collapsedWithButtonRef = useRef(false);

  const hasInContextLinks = commentPermalinkStyleSetting.get(forumType) === 'in-context';

  const { linkedCommentId, scrollToCommentId } = useCommentLinkState();

  const { lastCommentId, condensed, postPage, post, highlightDate, scrollOnExpand, forceSingleLine, forceNotSingleLine, expandOnlyCommentIds, noDOMId, onCollapse } = treeOptions;
  const animateWholeThread = forceSingleLine && loadChildrenSeparately;

  const shouldUncollapseForAutoScroll = useCallback(() => {
    const commentAndChildren = [
      comment,
      ...(childComments ? childComments.flatMap((c) => flattenCommentBranch(c)) : []),
    ];
    return commentAndChildren.some(child => child._id === scrollToCommentId)
  }, [childComments, comment, scrollToCommentId])

  const shouldExpandAndScrollTo = !noDOMId && !noAutoScroll && comment && scrollToCommentId === comment._id

  const beginCollapsedToSingleLine = useCallback(() => {
    return !shouldUncollapseForAutoScroll() && !forceUnCollapsed && (comment.deleted || (comment.baseScore ?? 0) < KARMA_COLLAPSE_THRESHOLD)
  }, [comment.baseScore, comment.deleted, forceUnCollapsed, shouldUncollapseForAutoScroll])

  const beginSingleLine = useCallback((): boolean => {
    // TODO: Before hookification, this got nestingLevel without the default value applied, which may have changed its behavior?
    const mostRecent = lastCommentId === comment._id
    const lowKarmaOrCondensed = ((comment.baseScore ?? 0) < 10 || !!condensed)
    const shortformAndTop = (nestingLevel === 1) && shortform
    const postPageAndTop = (nestingLevel === 1) && postPage

    if (expandOnlyCommentIds)
      return !expandOnlyCommentIds.has(comment._id);
    if (forceSingleLine)
      return true;
    if (treeOptions.isSideComment && nestingLevel>1)
      return true;

    return (
      !shouldExpandAndScrollTo &&
      !expandAllThreads &&
      !!(truncated || startThreadTruncated) &&
      lowKarmaOrCondensed &&
      !(mostRecent && condensed) &&
      !shortformAndTop &&
      !postPageAndTop &&
      !forceNotSingleLine
    )
  }, [comment._id, comment.baseScore, condensed, expandAllThreads, expandOnlyCommentIds, forceNotSingleLine, forceSingleLine, lastCommentId, nestingLevel, postPage, shortform, shouldExpandAndScrollTo, startThreadTruncated, treeOptions.isSideComment, truncated]);

  const beginTruncated = useCallback(() => {
    return !shouldExpandAndScrollTo && !!startThreadTruncated
  }, [shouldExpandAndScrollTo, startThreadTruncated])

  // Whether the comment has been collapsed to a single line with its replies
  // hidden behind a comment-count icon, either with the [-] button or because
  // it started out that way (deleted, or karma below the threshold). This
  // overrides the ordinary single-line logic below, which only applies to
  // truncated threads and leaves replies visible.
  const [collapsedToSingleLine, setCollapsedToSingleLine] = useState<boolean>(beginCollapsedToSingleLine);
  
  const [singleLine, setSingleLine] = useState(beginSingleLine());
  const [truncatedState, setTruncated] = useState(beginTruncated);
  const [truncatedStateSet, setTruncatedStateSet] = useState(false);

  const [highlighted, setHighlighted] = useState(false);

  const isInViewport = (): boolean => {
    if (!scrollTargetRef) return false;
    const top = scrollTargetRef.current?.getBoundingClientRect().top;
    if (top === undefined) return false;
    return (top >= 0) && (top <= window.innerHeight);
  }

  const scrollIntoView = useCallback((behavior: "auto"|"smooth"="smooth") => {
    if (!isInViewport() || hasInContextLinks) {
      scrollFocusOnElement({ id: comment._id, options: { behavior } });
    }
    setHighlighted(true);
    setTimeout(() => { //setTimeout make sure we execute this after the element has properly rendered
      setHighlighted(false);
    }, HIGHLIGHT_DURATION*1000);
  }, [comment._id, hasInContextLinks]);

  // If not using in-context comments, scroll to top when the `commentId` query changes
  useEffect(() => {
    if (!hasInContextLinks && !noAutoScroll && !treeOptions.isSideComment && comment && linkedCommentId === comment._id) {
      window.scrollTo({top: 0})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedCommentId]);

  useEffect(() => {
    // The comment hash isn't sent to the server, so `shouldUncollapseForAutoScroll` may be different from the first render pass
    if (collapsedToSingleLine && shouldUncollapseForAutoScroll()) {
      setCollapsedToSingleLine(false);
    }

    if (shouldExpandAndScrollTo) {
      handleExpand({scroll: true})
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToCommentId]);

  const collapseToSingleLine = useCallback(() => {
    onCollapse?.();
    heightBeforeResizeRef.current = animateWholeThread ? null : scrollTargetRef.current?.getBoundingClientRect().height ?? null;
    collapsedWithButtonRef.current = true;
    setCollapsedToSingleLine(true);
  }, [onCollapse, animateWholeThread]);

  const isTruncated = ((): boolean => {
    if (expandAllThreads) return false;
    if (truncatedState) return true;
    if (truncatedStateSet) return false;
    return truncated || !!startThreadTruncated
  })();

  const isNewComment = !!(highlightDate && (new Date(comment.postedAt).getTime() > new Date(highlightDate).getTime()))

  const isSingleLine = ((): boolean => {
    if (collapsedToSingleLine) return true;
    if (!singleLine || currentUserNoSingleLineCommentsSetting) return false;
    if (forceSingleLine) return true;
    if (forceNotSingleLine) return false

    return isTruncated && !(expandNewComments && isNewComment);
  })();

  useLayoutEffect(() => {
    const element = scrollTargetRef.current;
    const previousHeight = heightBeforeResizeRef.current;
    heightBeforeResizeRef.current = null;
    if (!element || previousHeight === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const newHeight = element.getBoundingClientRect().height;
    if (newHeight === previousHeight) {
      return;
    }

    // Measure the full content before paint, and release the height once the animation ends.
    const animation = element.animate([
      { height: `${previousHeight}px`, overflow: 'clip' },
      { height: `${newHeight}px`, overflow: 'clip' },
    ], { duration: 200, easing: 'ease-out' });

    return () => animation.cancel();
  }, [isTruncated, isSingleLine]);

  const updatedNestingLevel = nestingLevel + (!!comment.gapIndicator ? 1 : 0)

  const passedThroughItemProps = { comment, showPinnedOnProfile, enableGuidelines, showParentDefault }

  
  const childrenSection = childComments && childComments.length > 0 && <div className={classes.children}>
    <div className={classes.parentScroll} onClick={() => scrollIntoView("smooth")} />
    {showExtraChildrenButton}
    {childComments.map(child => <CommentsNode
      isChild={true}
      treeOptions={{
        ...treeOptions,
        ...(child.item.draft && COMMENT_DRAFT_TREE_OPTIONS),
      }}
      comment={child.item}
      parentCommentId={comment._id}
      parentAnswerId={parentAnswerId || (comment.answer && comment._id) || null}
      nestingLevel={updatedNestingLevel + 1}
      truncated={isTruncated}
      childComments={child.children}
      key={child.item._id}
      expandNewComments={expandNewComments}
      enableGuidelines={enableGuidelines} />)}
  </div>;

  const handleExpand = useCallback(({
    event,
    scroll = false,
    scrollBehaviour = "smooth",
  }: {
    event?: React.MouseEvent;
    scroll?: boolean;
    scrollBehaviour?: "auto" | "smooth";
  }) => {
    // Don't stop propagation if the click is inside an active editor, since
    // that would prevent Lexical from dispatching CLICK_COMMAND (which is
    // needed for image selection/resize and other decorator node interactions).
    const isInsideEditor = event?.target instanceof HTMLElement && event.target.closest('[contenteditable="true"]');
    if (!isInsideEditor) {
      event?.stopPropagation();
    }
    if (isTruncated || isSingleLine) {
      heightBeforeResizeRef.current = animateWholeThread ? null : scrollTargetRef.current?.getBoundingClientRect().height ?? null;
      captureEvent("commentExpanded", { postId: comment.postId, commentId: comment._id, draft: comment.draft });
      setTruncated(false);
      setSingleLine(false);
      setCollapsedToSingleLine(false);
      setTruncatedStateSet(true);
    }

    if (scroll) {
      scrollIntoView(scrollBehaviour);
    }
  }, [isTruncated, isSingleLine, animateWholeThread, comment.postId, comment._id, comment.draft, captureEvent, scrollIntoView]);

  const onClickFrame = useCallback((event: React.MouseEvent) => {
    handleExpand({ event, scroll: scrollOnExpand });
  }, [handleExpand, scrollOnExpand]);

  const result = (
    <CommentFrame
      comment={comment}
      treeOptions={treeOptions}
      onClick={onClickFrame}
      id={!noDOMId ? comment._id : undefined}
      nestingLevel={updatedNestingLevel}
      hasChildren={childComments && childComments.length>0}
      highlighted={highlighted}
      isSingleLine={isSingleLine}
      isChild={isChild}
      isNewComment={isNewComment}
      isReplyToAnswer={!!parentAnswerId}
      hoverPreview={hoverPreview}
      shortform={shortform}
      showPinnedOnProfile={showPinnedOnProfile}
      className={className}
    >
      {comment._id && <div ref={scrollTargetRef}>
        {isSingleLine
          ? <AnalyticsContext singleLineComment commentId={comment._id}>
              <AnalyticsTracker eventType="singeLineComment">
                <SingleLineComment
                  treeOptions={treeOptions}
                  comment={comment}
                  nestingLevel={updatedNestingLevel}
                  parentCommentId={parentCommentId}
                  hideKarma={post?.hideCommentKarma}
                  showDescendentCount={loadChildrenSeparately || collapsedToSingleLine}
                  displayTagIcon={displayTagIcon}
                  startsHovered={collapsedWithButtonRef.current}
                />
              </AnalyticsTracker>
            </AnalyticsContext>
          : <AnalyticsContext singleLineComment={false} commentId={comment._id}>
              <CommentsItem
                treeOptions={treeOptions}
                truncated={isTruncated && !forceUnTruncated} // forceUnTruncated checked separately here, so isTruncated can also be passed to child nodes
                nestingLevel={updatedNestingLevel}
                parentCommentId={parentCommentId}
                parentAnswerId={parentAnswerId || (comment.answer && comment._id) || undefined}
                collapseToSingleLine={collapseToSingleLine}
                key={comment._id}
                scrollIntoView={scrollIntoView}
                displayTagIcon={displayTagIcon}
                { ...passedThroughItemProps}
              />
            </AnalyticsContext>
        }
      </div>}

      <AnimatedCollapse expanded={!collapsedToSingleLine}>
        {childrenSection}

        {!isSingleLine && loadChildrenSeparately &&
          <div className="comments-children">
            <div className={classes.parentScroll} onClick={() => scrollIntoView("smooth")}/>
            <RepliesToCommentList
              parentCommentId={comment._id}
              post={post as PostsBase}
              directReplies={loadDirectReplies}
            />
          </div>
        }
      </AnimatedCollapse>
    </CommentFrame>
  );
  
  const animatedResult = animateWholeThread
    ? <AnimatedExpansion expanded={!isSingleLine}>{result}</AnimatedExpansion>
    : result;

  if (comment.gapIndicator) {
    return <div className={classes.gapIndicator}>
      {animatedResult}
    </div>
  } else {
    return animatedResult;
  }
}

const CommentsNode = registerComponent('CommentsNode', CommentsNodeInner, {
  areEqual: {
    treeOptions: "shallow",
    childComments: (oldValue: Array<CommentTreeNode<CommentsList>>, newValue: Array<CommentTreeNode<CommentsList>>) => commentTreesEqual(oldValue, newValue)
  },
  hocs: [withErrorBoundary]
});

export default CommentsNode;
