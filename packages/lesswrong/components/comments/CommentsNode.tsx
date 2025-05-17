import React, { useState, useRef, useEffect, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents"
import { CommentTreeNode, commentTreesEqual, flattenCommentBranch } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import CommentFrame, { HIGHLIGHT_DURATION } from './CommentFrame';
import { scrollFocusOnElement } from '@/lib/scrollUtils';
import { commentPermalinkStyleSetting } from '@/lib/publicSettings';
import { useCommentLinkState } from './CommentsItem/useCommentLink';
import SingleLineComment from "./SingleLineComment";
import CommentsItem from "./CommentsItem/CommentsItem";
import RepliesToCommentList from "../shortform/RepliesToCommentList";
import AnalyticsTracker from "../common/AnalyticsTracker";

const KARMA_COLLAPSE_THRESHOLD = -4;

const styles = (theme: ThemeType) => ({
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
    marginLeft: theme.spacing.unit,
    paddingTop: theme.spacing.unit,
  },
})

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
   * Determines the karma threshold used to decide whether to collapse a comment.
   * 
   * Currently only overriden in the comment moderation tab.
   */
  karmaCollapseThreshold?: number,
  /**
   * Determines whether to expand this comment's parent comment (if it exists) by default.
   * 
   * Default: false.  Currently only used in the comment moderation tab.
   */
  showParentDefault?: boolean,
  noAutoScroll?: boolean,
  displayTagIcon?: boolean,
  className?: string,
  classes: ClassesType<typeof styles>,
}
/**
 * CommentsNode: A node in a comment tree, passes through to CommentsItems to handle rendering a specific comment,
 * recurses to handle reply comments in the tree
 *
 * Before adding more props to this, consider whether you should instead be adding a field to the CommentTreeOptions interface.
 */
const CommentsNodeInner = ({
  treeOptions,
  comment,
  startThreadTruncated,
  truncated,
  shortform,
  nestingLevel=1,
  expandAllThreads,
  forceUnTruncated,
  forceUnCollapsed,
  expandNewComments=true,
  isChild,
  parentAnswerId,
  parentCommentId,
  showExtraChildrenButton,
  hoverPreview,
  childComments,
  loadChildrenSeparately,
  loadDirectReplies=false,
  showPinnedOnProfile=false,
  enableGuidelines=true,
  karmaCollapseThreshold=KARMA_COLLAPSE_THRESHOLD,
  showParentDefault=false,
  noAutoScroll=false,
  displayTagIcon=false,
  className,
  classes,
}: CommentsNodeProps) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const scrollTargetRef = useRef<HTMLDivElement|null>(null);

  const hasInContextLinks = commentPermalinkStyleSetting.get() === 'in-context';

  const { linkedCommentId, scrollToCommentId } = useCommentLinkState();

  const { lastCommentId, condensed, postPage, post, highlightDate, scrollOnExpand, forceSingleLine, forceNotSingleLine, expandOnlyCommentIds, noDOMId, onToggleCollapsed } = treeOptions;

  const shouldUncollapseForAutoScroll = useCallback(() => {
    const commentAndChildren = [
      comment,
      ...(childComments ? childComments.flatMap((c) => flattenCommentBranch(c)) : []),
    ];
    return commentAndChildren.some(child => child._id === scrollToCommentId)
  }, [childComments, comment, scrollToCommentId])

  const shouldExpandAndScrollTo = !noDOMId && !noAutoScroll && comment && scrollToCommentId === comment._id

  const beginCollapsed = useCallback(() => {
    return !shouldUncollapseForAutoScroll() && !forceUnCollapsed && (comment.deleted || (comment.baseScore ?? 0) < karmaCollapseThreshold)
  }, [comment.baseScore, comment.deleted, forceUnCollapsed, karmaCollapseThreshold, shouldUncollapseForAutoScroll])

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

  // Whether the comment is completely hidden (with the toggle arrow closed)
  const [collapsed, setCollapsed] = useState<boolean>(beginCollapsed);
  
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
    console.log("Is scrolling into view")
    if (!isInViewport() || hasInContextLinks) {
      scrollFocusOnElement({ id: comment._id, options: { behavior } });
    }
    setHighlighted(true);
    setTimeout(() => { //setTimeout make sure we execute this after the element has properly rendered
      setHighlighted(false);
    }, HIGHLIGHT_DURATION*1000);
  }, [comment._id, hasInContextLinks]);

  const handleExpand = ({
    event,
    scroll = false,
    scrollBehaviour = "smooth",
  }: {
    event?: React.MouseEvent;
    scroll?: boolean;
    scrollBehaviour?: "auto" | "smooth";
  }) => {
    event?.stopPropagation();
    if (isTruncated || isSingleLine) {
      captureEvent("commentExpanded", { postId: comment.postId, commentId: comment._id });
      setTruncated(false);
      setSingleLine(false);
      setTruncatedStateSet(true);
    }

    // TODO split out this change and put it up as a separate PR
    if (scroll) {
      scrollIntoView(scrollBehaviour);
    }
  };

  // If not using in-context comments, scroll to top when the `commentId` query changes
  useEffect(() => {
    if (!hasInContextLinks && !noAutoScroll && comment && linkedCommentId === comment._id) {
      window.scrollTo({top: 0})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedCommentId]);

  useEffect(() => {
    // The comment hash isn't sent to the server, so `shouldUncollapseForAutoScroll` may be different from the first render pass
    if (collapsed && shouldUncollapseForAutoScroll()) {
      setCollapsed(false);
    }

    if (shouldExpandAndScrollTo) {
      handleExpand({scroll: true})
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToCommentId]);

  const toggleCollapse = useCallback(
    () => {
      onToggleCollapsed?.();
      setCollapsed(!collapsed)
    },
    [collapsed, onToggleCollapsed]
  );

  const isTruncated = ((): boolean => {
    if (expandAllThreads) return false;
    if (truncatedState) return true;
    if (truncatedStateSet) return false;
    return truncated || !!startThreadTruncated
  })();

  const isNewComment = !!(highlightDate && (new Date(comment.postedAt).getTime() > new Date(highlightDate).getTime()))

  const isSingleLine = ((): boolean => {
    if (!singleLine || currentUser?.noSingleLineComments) return false;
    if (forceSingleLine) return true;
    if (forceNotSingleLine) return false

    return isTruncated && !(expandNewComments && isNewComment);
  })();
  const updatedNestingLevel = nestingLevel + (!!comment.gapIndicator ? 1 : 0)

  const passedThroughItemProps = { comment, collapsed, showPinnedOnProfile, enableGuidelines, showParentDefault }

  
  const childrenSection = !collapsed && childComments && childComments.length > 0 && <div className={classes.children}>
    <div className={classes.parentScroll} onClick={() => scrollIntoView("smooth")} />
    {showExtraChildrenButton}
    {childComments.map(child => <CommentsNode
      isChild={true}
      treeOptions={treeOptions}
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

  return <div className={comment.gapIndicator ? classes.gapIndicator : undefined}>
    <CommentFrame
      comment={comment}
      treeOptions={treeOptions}
      onClick={(event) => handleExpand({ event, scroll: scrollOnExpand })}
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
                  showDescendentCount={loadChildrenSeparately}
                  displayTagIcon={displayTagIcon}
                />
              </AnalyticsTracker>
            </AnalyticsContext>
          : <CommentsItem
              treeOptions={treeOptions}
              truncated={isTruncated && !forceUnTruncated} // forceUnTruncated checked separately here, so isTruncated can also be passed to child nodes
              nestingLevel={updatedNestingLevel}
              parentCommentId={parentCommentId}
              parentAnswerId={parentAnswerId || (comment.answer && comment._id) || undefined}
              toggleCollapse={toggleCollapse}
              key={comment._id}
              scrollIntoView={scrollIntoView}
              setSingleLine={setSingleLine}
              displayTagIcon={displayTagIcon}
              { ...passedThroughItemProps}
            />
        }
      </div>}

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
    </CommentFrame>
  </div>
}

const CommentsNode = registerComponent('CommentsNode', CommentsNodeInner, {
  styles,
  areEqual: {
    treeOptions: "shallow",
    childComments: (oldValue: Array<CommentTreeNode<CommentsList>>, newValue: Array<CommentTreeNode<CommentsList>>) => commentTreesEqual(oldValue, newValue)
  },
  hocs: [withErrorBoundary]
});

export default CommentsNode;
