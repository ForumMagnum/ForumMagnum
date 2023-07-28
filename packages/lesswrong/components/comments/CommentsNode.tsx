import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../lib/routeUtil';
import withErrorBoundary from '../common/withErrorBoundary';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents"
import { CommentTreeNode, commentTreesEqual, countCommentsInTree } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import { HIGHLIGHT_DURATION } from './CommentFrame';
import { CommentPoolContext, CommentPoolContextType, CommentExpansionState } from './CommentPool';
import { useForceRerender } from '../hooks/useForceRerender';

const KARMA_COLLAPSE_THRESHOLD = -4;

const styles = (theme: ThemeType): JssStyles => ({
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
  loadMoreReplies: {
    paddingLeft: 12,
    paddingBottom: 8,
  },
})

export interface CommentsNodeProps {
  treeOptions: CommentTreeOptions,
  comment: CommentsList,
  startThreadTruncated?: boolean,
  truncated?: boolean,
  shortform?: any,
  nestingLevel?: number,
  expandAllThreads?:boolean,
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
  classes: ClassesType,
}

/**
 * CommentsNode: A node in a comment tree, passes through to CommentsItems to handle rendering a specific comment,
 * recurses to handle reply comments in the tree
 *
 * Before adding more props to this, consider whether you should instead be adding a field to the CommentTreeOptions interface.
 */
const CommentsNode = ({
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
  karmaCollapseThreshold=KARMA_COLLAPSE_THRESHOLD,
  showParentDefault=false,
  noAutoScroll=false,
  displayTagIcon=false,
  className,
  classes,
}: CommentsNodeProps) => {
  const commentPoolContext = useContext(CommentPoolContext);
  const forceRerender = useForceRerender();
  const { captureEvent } = useTracking()
  
  useEffect(() => {
    if (commentPoolContext) {
      const commentPoolState = commentPoolContext.getCommentState(comment._id);
      if (commentPoolState) {
        commentPoolState.rerender = forceRerender;
        return () => {
          commentPoolState.rerender = null;
        }
      }
    }
  }, [commentPoolContext, comment._id, forceRerender]);

  const scrollTargetRef = useRef<HTMLDivElement|null>(null);
  const [collapsed, setCollapsed] = useCommentState(
    "collapsed", comment._id, commentPoolContext,
    !forceUnCollapsed && (comment.deleted || comment.baseScore < karmaCollapseThreshold || comment.modGPTRecommendation === 'Intervene')
  );
  const { post, highlightDate, scrollOnExpand, noHash, singleLineCollapse, onToggleCollapsed } = treeOptions;

  const isNewComment = !!(highlightDate && (new Date(comment.postedAt).getTime() > new Date(highlightDate).getTime()))
  const [hasClickedToExpand, setHasClickedToExpand] = useState(false);
  const [highlighted, setHighlighted] = useState(false);


  const {isTruncated, isSingleLine, setExpansionState} = useExpansionState({
    comment, commentPoolContext, treeOptions,
    isNewComment, hasClickedToExpand,
    expandAllThreads, nestingLevel, startThreadTruncated, shortform, truncated
  });
  
  const isInViewport = (): boolean => {
    if (!scrollTargetRef) return false;
    const top = scrollTargetRef.current?.getBoundingClientRect().top;
    if (top === undefined) return false;
    return (top >= 0) && (top <= window.innerHeight);
  }

  const scrollIntoView = useCallback((highlight=true, behavior:"auto"|"smooth"="smooth") => {
    if (!isInViewport()) {
      scrollTargetRef.current?.scrollIntoView({behavior: behavior, block: "center", inline: "nearest"});
    }
    
    if (highlight) {
      setHighlighted(true);
      setTimeout(() => { //setTimeout make sure we execute this after the element has properly rendered
        setHighlighted(false);
      }, HIGHLIGHT_DURATION*1000);
    }
  }, []);

  const handleExpand = useCallback(async (event?: React.MouseEvent) => {
    event?.stopPropagation()
    if (isTruncated || isSingleLine) {
      captureEvent('commentExpanded', {postId: comment.postId, commentId: comment._id})
      if (isSingleLine) {
        setExpansionState("truncated");
      } else {
        setExpansionState("expanded");
        setHasClickedToExpand(true);
      }
      if (scrollOnExpand) {
        scrollIntoView(false, "auto") // should scroll instantly
      }
    }
  }, [isTruncated, isSingleLine, setExpansionState, setHasClickedToExpand, scrollOnExpand, scrollIntoView, captureEvent, comment._id, comment.postId]);

  const {hash: commentHash} = useSubscribedLocation();
  useEffect(() => {
    if (!noHash && !noAutoScroll && comment && commentHash === ("#" + comment._id)) {
      setTimeout(() => { //setTimeout make sure we execute this after the element has properly rendered
        void handleExpand()
        scrollIntoView(true)
      }, 0);
    }
    //No exhaustive deps because this is supposed to run only on mount
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentHash]);

  const toggleCollapse = useCallback(() => {
    if (singleLineCollapse && !collapsed) {
      setExpansionState("singleLine");
    } else {
      onToggleCollapsed?.();
      setCollapsed(!collapsed);
    }
  }, [singleLineCollapse, collapsed, setCollapsed, setExpansionState, onToggleCollapsed]);

  const { CommentFrame, SingleLineComment, CommentsItem, RepliesToCommentList, AnalyticsTracker, LoadMore } = Components

  const passedThroughItemProps = { comment, collapsed, showPinnedOnProfile, showParentDefault }

  const numShownReplies = childComments?.length ?? 0
  const numHiddenReplies = comment.directChildrenCount - numShownReplies;
  const loadMoreMessage = `View ${numHiddenReplies} ${numHiddenReplies === 1 ? "reply" : "replies"}`;
  
  const enableDescendentCount = loadChildrenSeparately || treeOptions.singleLineCommentsShowDescendentCount
  const showDescendentCount = enableDescendentCount
    ? (comment.descendentCount - (childComments ? countCommentsInTree(childComments) : 0))
    : undefined;

  return <div>
    <CommentFrame
      comment={comment}
      treeOptions={treeOptions}
      onClick={(event) => handleExpand(event)}
      id={!noHash ? comment._id : undefined}
      nestingLevel={nestingLevel}
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
                  nestingLevel={nestingLevel}
                  parentCommentId={parentCommentId}
                  hideKarma={post?.hideCommentKarma}
                  showDescendentCount={showDescendentCount}
                  displayTagIcon={displayTagIcon}
                />
              </AnalyticsTracker>
            </AnalyticsContext>
          : <CommentsItem
              treeOptions={treeOptions}
              truncated={isTruncated && !forceUnTruncated} // forceUnTruncated checked separately here, so isTruncated can also be passed to child nodes
              nestingLevel={nestingLevel}
              parentCommentId={parentCommentId}
              parentAnswerId={parentAnswerId || (comment.answer && comment._id) || undefined}
              toggleCollapse={toggleCollapse}
              key={comment._id}
              scrollIntoView={scrollIntoView}
              displayTagIcon={displayTagIcon}
              {...passedThroughItemProps}
            />
        }
      </div>}

      {!collapsed && childComments && childComments.length>0 && <div className={classes.children}>
        <div className={classes.parentScroll} onClick={() => scrollIntoView(false, "smooth")}/>
        { showExtraChildrenButton }
        {childComments.map(child =>
          <Components.CommentNodeOrPlaceholder
            isChild={true}
            treeOptions={treeOptions}
            treeNode={child}
            parentCommentId={comment._id}
            parentAnswerId={parentAnswerId || (comment.answer && comment._id) || null}
            nestingLevel={nestingLevel+1}
            truncated={isTruncated}
            key={child._id}
          />)}
      </div>}

      {!isSingleLine && loadChildrenSeparately &&
        <div className="comments-children">
          <div className={classes.parentScroll} onClick={() => scrollIntoView(false, "smooth")}/>
          <RepliesToCommentList
            parentCommentId={comment._id}
            post={post as PostsBase}
            directReplies={loadDirectReplies}
          />
        </div>
      }
      
      {!isSingleLine && !collapsed && commentPoolContext
        && (!childComments || comment.directChildrenCount > childComments.length)
        && <div className={classes.loadMoreReplies}>
          <LoadMore
            message={loadMoreMessage}
            loadMore={async () => {
              await commentPoolContext.showMoreChildrenOf(comment._id);
            }}
          />
        </div>
      }
    </CommentFrame>
  </div>
}

function useExpansionState({comment, commentPoolContext, treeOptions, isNewComment, hasClickedToExpand, expandAllThreads, nestingLevel, startThreadTruncated, shortform, truncated}: {
  comment: CommentsList,
  commentPoolContext: CommentPoolContextType|null,
  treeOptions: CommentTreeOptions,

  // Computed inside CommentsNode
  isNewComment: boolean,
  hasClickedToExpand: boolean,

  // Props to CommentsNode
  expandAllThreads: boolean|undefined,
  nestingLevel: number,
  startThreadTruncated: boolean|undefined,
  shortform: boolean|undefined,
  truncated: boolean|undefined,
}) {
  const currentUser = useCurrentUser();
  const commentId = comment._id;
  const { lastCommentId, condensed, postPage, forceSingleLine, forceNotSingleLine, dontExpandNewComments } = treeOptions;

  const [truncatedState, setTruncated] = useCommentState(
    "truncatedState", commentId, commentPoolContext,
    !!startThreadTruncated
  );

  const beginSingleLine = (): boolean => {
    if (currentUser?.noSingleLineComments)
      return false;

    // TODO: Before hookification, this got nestingLevel without the default value applied, which may have changed its behavior?
    const mostRecent = lastCommentId === commentId
    const lowKarmaOrCondensed = (comment.baseScore < 10 || !!condensed)
    const shortformAndTop = (nestingLevel === 1) && shortform
    const postPageAndTop = (nestingLevel === 1) && postPage

    if (forceSingleLine)
      return true;
    if (forceNotSingleLine)
      return false;
    if (treeOptions.isSideComment && nestingLevel>1)
      return true;

    if (expandAllThreads) return false;
    if (!truncated && !startThreadTruncated) return false;
    if (!lowKarmaOrCondensed) return false;
    if (mostRecent && condensed) return false;
    if (shortformAndTop) return false;
    if (postPageAndTop) return false;
    if (isNewComment && !dontExpandNewComments) return false;

    return true;
  }

  const [singleLine, setSingleLine] = useCommentState(
    "singleLine", commentId, commentPoolContext,
    beginSingleLine()
  );

  const isTruncated = ((): boolean => {
    if (expandAllThreads) return false;
    if (truncatedState) return true;
    if (hasClickedToExpand) return false;
    return truncated || !!startThreadTruncated
  })();

  const isSingleLine = ((): boolean => {
    if (!singleLine) return false;
    if (forceSingleLine) return true;
    if (forceNotSingleLine) return false

    return isTruncated
  })();
  
  let expansionState: CommentExpansionState = "default";
  if (commentPoolContext) {
    expansionState = commentPoolContext.getCommentState(commentId).expansion;
  }
  
  if (expansionState === "default") {
    if (isSingleLine) expansionState = "singleLine";
    else if (isTruncated)  expansionState = "truncated";
    else expansionState = "expanded";
  }
  
  const setExpansionState = useCallback((newExpansionState: CommentExpansionState) => {
    if (commentPoolContext) {
      void commentPoolContext.setExpansion(commentId, expansionState, newExpansionState);
    } else {
      if (newExpansionState === "singleLine") {
        setSingleLine(true);
        setTruncated(true);
      } else if (newExpansionState === "truncated") {
        setSingleLine(false);
        setTruncated(true);
      } else {
        setSingleLine(false);
        setTruncated(false);
      }
    }
  }, [commentId, commentPoolContext, expansionState, setSingleLine, setTruncated]);

  if (commentPoolContext) {
    const expansionState = commentPoolContext.getCommentState(commentId)?.expansion ?? "default";
    
    return {
      isTruncated: (expansionState==="default") ? isTruncated : (expansionState!=="expanded"),
      isSingleLine: (expansionState==="default") ? isSingleLine : (expansionState==="singleLine"),
      setExpansionState,
    };
  } else {
    return {
      isTruncated,
      isSingleLine,
      setExpansionState,
    };
  }
}

/**
 * This function works similarly to React's useState, and if there's no comment
 * pool context available, it wraps useState. However, if there *is* a
 * comment-pool context available, it stores the state in the comment-pool
 * context keyed by name and comment ID, rather than a React useState hook. The
 * reason for this is that loading additional comments (in particular, comments
 * that are this comment's ancestor) can cause the comment to be reparented in
 * the React tree, losing its state.
 */
function useCommentState<T>(
  name: string,
  commentId: string,
  commentPoolContext: CommentPoolContextType|null,
  initialValue: T
): [T,(newValue:T)=>void] {
  const reactStateAndSetState = useState(initialValue);
  
  if (commentPoolContext) {
    const commentState = commentPoolContext.getCommentState(commentId);
    if (!(name in commentState.otherState)) {
      const setState = (newState: T) => {
        const oldStateAndSetState = commentState.otherState[name];
        commentState.otherState[name] = [newState, oldStateAndSetState[1]];
        //TODO: force rerender
      };
      commentState.otherState[name] = [initialValue, setState];
    }
    return commentState.otherState[name];
  } else {
    return reactStateAndSetState;
  }
}

const CommentsNodeComponent = registerComponent('CommentsNode', CommentsNode, {
  styles,
  areEqual: {
    treeOptions: "shallow",
    childComments: (oldValue: Array<CommentTreeNode<CommentsList>>, newValue: Array<CommentTreeNode<CommentsList>>) => commentTreesEqual(oldValue, newValue)
  },
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    CommentsNode: typeof CommentsNodeComponent,
  }
}
