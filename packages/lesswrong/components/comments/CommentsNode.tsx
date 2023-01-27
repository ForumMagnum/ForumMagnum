import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../lib/routeUtil';
import withErrorBoundary from '../common/withErrorBoundary';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents"
import { CommentTreeNode, commentTreesEqual } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import { HIGHLIGHT_DURATION } from './CommentFrame';

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
  expandAllThreads?:boolean,
  /**
   * Determines whether this specific comment is expanded, without passing that
   * expanded state to child comments
   */
  expandByDefault?: boolean,
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
  expandByDefault,
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
  classes,
}: CommentsNodeProps) => {
  const currentUser = useCurrentUser();
  const scrollTargetRef = useRef<HTMLDivElement|null>(null);
  const [collapsed, setCollapsed] = useState(comment.deleted || comment.baseScore < karmaCollapseThreshold);
  const [truncatedState, setTruncated] = useState(!!startThreadTruncated);
  const { lastCommentId, condensed, postPage, post, highlightDate, scrollOnExpand, forceSingleLine, forceNotSingleLine, noHash } = treeOptions;

  // Child comments need to know whether the root comment in any given thread has a comment approval status or not
  const updatedTreeOptions: CommentTreeOptions = {
    ...treeOptions,
    ...(comment.commentApproval ? { rootCommentApproval: comment.commentApproval } : {})
  }

  const beginSingleLine = (): boolean => {
    // TODO: Before hookification, this got nestingLevel without the default value applied, which may have changed its behavior?
    const mostRecent = lastCommentId === comment._id
    const lowKarmaOrCondensed = (comment.baseScore < 10 || !!condensed)
    const shortformAndTop = (nestingLevel === 1) && shortform
    const postPageAndTop = (nestingLevel === 1) && postPage

    if (forceSingleLine)
      return true;
    if (treeOptions.isSideComment && nestingLevel>1)
      return true;

    return (
      !expandAllThreads &&
      !!(truncated || startThreadTruncated) &&
      lowKarmaOrCondensed &&
      !(mostRecent && condensed) &&
      !shortformAndTop &&
      !postPageAndTop &&
      !forceNotSingleLine
    )
  }
  
  const [singleLine, setSingleLine] = useState(beginSingleLine());
  const [truncatedStateSet, setTruncatedStateSet] = useState(false);
  const [highlighted, setHighlighted] = useState(false);

  const isInViewport = (): boolean => {
    if (!scrollTargetRef) return false;
    const top = scrollTargetRef.current?.getBoundingClientRect().top;
    if (top === undefined) return false;
    return (top >= 0) && (top <= window.innerHeight);
  }

  const scrollIntoView = useCallback((behavior:"auto"|"smooth"="smooth") => {
    if (!isInViewport()) {
      scrollTargetRef.current?.scrollIntoView({behavior: behavior, block: "center", inline: "nearest"});
    }
    setHighlighted(true);
    setTimeout(() => { //setTimeout make sure we execute this after the element has properly rendered
      setHighlighted(false);
    }, HIGHLIGHT_DURATION*1000);
  }, []);

  const handleExpand = async (event?: React.MouseEvent) => {
    event?.stopPropagation()
    if (isTruncated || isSingleLine) {
      setTruncated(false);
      setSingleLine(false);
      setTruncatedStateSet(true);
      if (scrollOnExpand) {
        scrollIntoView("auto") // should scroll instantly
      }
    }
  }

  const {hash: commentHash} = useSubscribedLocation();
  useEffect(() => {
    if (!noHash && !noAutoScroll && comment && commentHash === ("#" + comment._id)) {
      setTimeout(() => { //setTimeout make sure we execute this after the element has properly rendered
        void handleExpand()
        scrollIntoView()
      }, 0);
    }
    //No exhaustive deps because this is supposed to run only on mount
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentHash]);

  const toggleCollapse = useCallback(
    () => setCollapsed(!collapsed),
    [collapsed]
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

  const { CommentFrame, SingleLineComment, CommentsItem, RepliesToCommentList, AnalyticsTracker } = Components

  const updatedNestingLevel = nestingLevel + (!!comment.gapIndicator ? 1 : 0)

  const passedThroughItemProps = { comment, collapsed, showPinnedOnProfile, enableGuidelines, showParentDefault }

  return <div className={comment.gapIndicator && classes.gapIndicator}>
    <CommentFrame
      comment={comment}
      treeOptions={updatedTreeOptions}
      onClick={(event) => handleExpand(event)}
      id={!noHash ? comment._id : undefined}
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
    >
      {comment._id && <div ref={scrollTargetRef}>
        {isSingleLine
          ? <AnalyticsContext singleLineComment commentId={comment._id}>
              <AnalyticsTracker eventType="singeLineComment">
                <SingleLineComment
                  treeOptions={updatedTreeOptions}
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
              treeOptions={updatedTreeOptions}
              truncated={isTruncated && !expandByDefault} // expandByDefault checked separately here, so isTruncated can also be passed to child nodes
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

      {!collapsed && childComments && childComments.length>0 && <div className={classes.children}>
        <div className={classes.parentScroll} onClick={() => scrollIntoView("smooth")}/>
        { showExtraChildrenButton }
        {childComments.map(child =>
          <Components.CommentsNode
            isChild={true}
            treeOptions={updatedTreeOptions}
            comment={child.item}
            parentCommentId={comment._id}
            parentAnswerId={parentAnswerId || (comment.answer && comment._id) || null}
            nestingLevel={updatedNestingLevel+1}
            truncated={isTruncated}
            childComments={child.children}
            key={child.item._id}
            expandNewComments={expandNewComments}
            enableGuidelines={enableGuidelines}
          />)}
      </div>}

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
