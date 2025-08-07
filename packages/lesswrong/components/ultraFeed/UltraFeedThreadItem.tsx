import React, { useMemo, useState, useCallback } from "react";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { DisplayFeedCommentThread, FeedCommentMetaInfo, FeedItemDisplayStatus, FeedItemSourceType } from "./ultraFeedTypes";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";
import UltraFeedPostItem from "./UltraFeedPostItem";
import UltraFeedThreadCommentsList from "./UltraFeedThreadCommentsList";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { userGetDisplayName } from "@/lib/collections/users/helpers";

// Only used as a fallback when post is not preloaded
const PostsListWithVotesQuery = gql(`
  query UltraFeedThreadItem($documentId: String) {
    post(selector: { _id: $documentId }) {
      result {
        ...PostsListWithVotes
      }
    }
  }
`);

const itemSeparator = (theme: ThemeType) => ({
  content: '""',
  position: 'absolute',
  bottom: 0,
  left: 16,
  right: 16,
  height: 2,
  backgroundColor: theme.palette.greyAlpha(0.05)
})

const styles = defineStyles("UltraFeedThreadItem", (theme: ThemeType) => ({
  postContainer: {
    position: 'relative',
    borderBottom: theme.palette.border.itemSeparatorBottom,
    background: theme.palette.panelBackground.bannerAdTranslucentHeavy,
  },
  commentsRoot: {
    borderRadius: 4,
    background: theme.palette.panelBackground.bannerAdTranslucentHeavy,
    backdropFilter: theme.palette.filters.bannerAdBlurHeavy,
  },
  commentsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: "16px",
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  postsLoadingContainer: {
    backgroundColor: theme.palette.panelBackground.default,
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    '&::after': itemSeparator(theme),
  },
}));

type CommentDisplayStatusMap = Record<string, FeedItemDisplayStatus>;

/* if there are multiple comments in a row that are collapsed, compress them into a single placeholder */
const compressCollapsedComments = (
  displayStatuses: CommentDisplayStatusMap,
  comments: UltraFeedComment[],
) => {
  const result: Array<UltraFeedComment | { placeholder: true; hiddenComments: UltraFeedComment[] }> = [];

  if (comments.length === 0) return result;

  if (comments.length > 0) {
    result.push(comments[0]);
  }

  let tempGroup: UltraFeedComment[] = [];

  const flushGroupIfNeeded = () => {
    if (tempGroup.length >= 2) {
      result.push({ placeholder: true, hiddenComments: [...tempGroup] });
    } else {
      tempGroup.forEach(item => result.push(item));
    }
    tempGroup = [];
  };

  for (let i = 1; i < comments.length; i++) {
    const comment = comments[i];
    const commentId = comment._id;
    const localStatus = displayStatuses[commentId] || "collapsed"

    if (localStatus === "collapsed" || localStatus === "hidden") {
      tempGroup.push(comment);
    } else {
      // If we hit a non-collapsed/hidden comment, flush the current group
      flushGroupIfNeeded();
      result.push(comment);
    }
  }
  flushGroupIfNeeded();

  return result;
}

const calculateInitialDisplayStatuses = (
  comments: UltraFeedComment[],
  metaInfos: Record<string, FeedCommentMetaInfo> | undefined
): CommentDisplayStatusMap => {
  const result: CommentDisplayStatusMap = {};
  for (const [commentId, meta] of Object.entries(metaInfos ?? {})) {
    // For the first comment, ensure it's at least "collapsed"
    if (comments.length > 0 && commentId === comments[0]._id) {
      const firstCommentStatus = meta.displayStatus === "hidden"
      ? "collapsed"
      : meta.displayStatus ?? "collapsed";
      result[commentId] = firstCommentStatus;
    } else {
      result[commentId] = meta.displayStatus ?? "collapsed"; 
    }
  }
  return result;
};

const initializeHighlightStatuses = (
  initialDisplayStatuses: CommentDisplayStatusMap,
  metaInfos: Record<string, FeedCommentMetaInfo> | undefined
): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  for (const commentId of Object.keys(initialDisplayStatuses)) {
    const metaInfo = metaInfos?.[commentId];
    result[commentId] = metaInfo?.highlight ?? false;
  }
  return result;
};

const UltraFeedThreadItem = ({thread, index, settings = DEFAULT_SETTINGS, startReplyingTo}: {
  thread: DisplayFeedCommentThread,
  index: number,
  settings?: UltraFeedSettingsType,
  startReplyingTo?: string,
}) => {
  const classes = useStyles(styles);
  
  const { comments, commentMetaInfos, isOnReadPost, postSources, post: preloadedPost } = thread;
  const {captureEvent} = useTracking();

  const isShortform = comments[0].shortform
  const postInitiallyExpanded = !isOnReadPost && !isShortform;
  const [ postExpanded, setPostExpanded ] = useState(postInitiallyExpanded);
  const [animatingCommentIds, setAnimatingCommentIds] = useState<Set<string>>(new Set());
  const [postIsAnimating, setPostIsAnimating] = useState(false);

  // State for handling new replies (including allowing switching back to original subsequent comments)
  const [newReplies, setNewReplies] = useState<Record<string, UltraFeedComment>>({});
  const [branchViewStates, setBranchViewStates] = useState<Record<string, 'new' | 'original'>>({});
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(startReplyingTo ?? null);
  
  const shouldLoadPost = !preloadedPost && postExpanded && comments[0].postId;
  const { loading, data } = useQuery(PostsListWithVotesQuery, {
    variables: { documentId: comments[0].postId ?? undefined },
    skip: !shouldLoadPost,
  });
  const post = preloadedPost ?? data?.post?.result;

  const postMetaInfo = {
    sources: postSources ?? commentMetaInfos?.[comments[0]._id]?.sources ?? [],
    displayStatus: "expanded" as FeedItemDisplayStatus,
    servedEventId: commentMetaInfos?.[comments[0]._id]?.servedEventId ?? '',
    highlight: !isOnReadPost,
  }

  const postSettings = {
    ...settings,
    displaySettings: {
      ...settings.displaySettings,
      postInitialWords: 50
    }
  }

  const initialDisplayStatuses = calculateInitialDisplayStatuses(comments, commentMetaInfos);
  const initialHighlightStatuses = initializeHighlightStatuses(initialDisplayStatuses, commentMetaInfos);
  const [commentDisplayStatuses, setCommentDisplayStatuses] = useState<CommentDisplayStatusMap>(initialDisplayStatuses);
  const [highlightStatuses] = useState<Record<string, boolean>>(initialHighlightStatuses);
  
  const commentAuthorsMap = useMemo(() => {
    const authorsMap: Record<string, string | null> = {};
    comments.forEach(comment => {
      authorsMap[comment._id] = userGetDisplayName(comment.user) ?? null;
    });
    return authorsMap;
  }, [comments]);
  
  const setDisplayStatus = useCallback((commentId: string, newStatus: FeedItemDisplayStatus) => {
    setCommentDisplayStatuses(prev => ({
      ...prev,
      [commentId]: newStatus,
    }));
  }, []);

  // Build the list of comments to display, incorporating new replies.
  // When a user replies to a comment, we show their new reply and hide all subsequent
  // comments in the original thread (creating a "fork" in the conversation).
  const buildDisplayComments = useMemo(() => {
    const result: UltraFeedComment[] = [];

    for (const comment of comments) {
      result.push(comment);

      // Check if this comment has a new reply
      const newReply = newReplies[comment._id];
      if (newReply && branchViewStates[comment._id] !== 'original') {
        // Add the new reply after its parent, skip all remaining comments since we've forked the conversation
        result.push(newReply);
        break;
      }
    }

    return result;
  }, [comments, newReplies, branchViewStates]);

  const visibleComments = useMemo(
    () => buildDisplayComments.filter(c => commentDisplayStatuses[c._id] !== "hidden"),
    [buildDisplayComments, commentDisplayStatuses]
  );

  const compressedItems = useMemo(() => {
    return compressCollapsedComments(commentDisplayStatuses, visibleComments);
  }, [visibleComments, commentDisplayStatuses]);

  const triggerParentHighlight = useCallback((commentId: string) => {
    const comment = comments.find(c => c._id === commentId);
    
    if (comment && !comment.parentCommentId && postExpanded) {
      setPostIsAnimating(true);
      setTimeout(() => {
        setPostIsAnimating(false);
      }, 100);
      
      captureEvent("ultraFeedReplyIconClicked", { commentId, parentType: "post", postId: comment.postId });
    } else if (comment?.parentCommentId) {
      const parentCommentId = comment.parentCommentId;
      
      const parentStatus = commentDisplayStatuses[parentCommentId];
      const wasCollapsed = parentStatus === "collapsed" || parentStatus === "hidden";
      
      if (wasCollapsed) {
        setDisplayStatus(parentCommentId, "expanded");
      }
      
      const highlightDelay = wasCollapsed ? 300 : 0;
      
      setTimeout(() => {
        setAnimatingCommentIds(prev => new Set(prev).add(parentCommentId));
        
        setTimeout(() => {
          setAnimatingCommentIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(parentCommentId);
            return newSet;
          });
        }, 100);
      }, highlightDelay);
      
      captureEvent("ultraFeedReplyIconClicked", {
        commentId,
        parentCommentId: parentCommentId,
        wasCollapsed,
      });
    }
  }, [comments, commentDisplayStatuses, setDisplayStatus, captureEvent, postExpanded]);

  const handleReplyClick = (commentId: string) => {
    setReplyingToCommentId(commentId);
  };

  const handleReplySubmit = (parentCommentId: string, newComment: UltraFeedComment) => {
    setNewReplies(prev => ({
      ...prev,
      [parentCommentId]: newComment
    }));
    setBranchViewStates(prev => ({
      ...prev,
      [parentCommentId]: 'new'
    }));
    setReplyingToCommentId(null);
    
    setCommentDisplayStatuses(prev => ({
      ...prev,
      [newComment._id]: 'expanded'
    }));
  };

  const handleBranchToggle = (parentCommentId: string) => {
    setBranchViewStates(prev => ({
      ...prev,
      [parentCommentId]: prev[parentCommentId] === 'new' ? 'original' : 'new'
    }));
  };

  const handleNewReplyEdit = useCallback((editedComment: CommentsList) => {
    const parentId = Object.entries(newReplies).find(
      ([_, reply]) => reply._id === editedComment._id
    )?.[0];

    const editedNewReply = {
      ...editedComment,
      post: comments[0].post,
    }
    
    if (parentId) {
      setNewReplies(prev => ({
        ...prev,
        [parentId]: editedNewReply
      }));
    }
  }, [newReplies, comments]);

  const getNavigationProps = (commentId: string, displayComments: UltraFeedComment[]) => {
    const parentIdForNewReply = Object.entries(newReplies).find(
      ([parentId, reply]) => reply._id === commentId
    )?.[0];

    if (parentIdForNewReply) {
      // This is a new reply - it should show navigation if there are more comments after its parent
      const parentIndex = comments.findIndex(c => c._id === parentIdForNewReply);
      const hasMoreComments = parentIndex >= 0 && parentIndex < comments.length - 1;
      
      return {
        showNav: hasMoreComments,
        forkParentId: parentIdForNewReply,
        currentBranch: 'new' as const
      };
    }

    // Check if this is the first comment after a fork point where we chose 'original'
    const commentIndex = displayComments.findIndex(c => c._id === commentId);
    if (commentIndex > 0) {
      const prevComment = displayComments[commentIndex - 1];
      
      // Check if the previous comment has a new reply that we're not showing
      if (newReplies[prevComment._id] && branchViewStates[prevComment._id] === 'original') {
        return {
          showNav: true,
          forkParentId: prevComment._id,
          currentBranch: 'original' as const
        };
      }
    }

    return { showNav: false, forkParentId: null, currentBranch: 'new' as const };
  };

  const handlePostExpansion = useCallback(() => {
    captureEvent("ultraFeedThreadPostExpanded", {
      threadId: thread._id,
      postId: comments[0].postId,
    });
    setPostExpanded(true);
  }, [thread._id, comments, captureEvent]);

  return (
    <AnalyticsContext pageParentElementContext="ultraFeedThread" ultraFeedCardId={thread._id} feedCardIndex={index}>
    {postExpanded && !post && loading && <div className={classes.postsLoadingContainer}>
      <Loading />
    </div>}
    {postExpanded && post && <div className={classes.postContainer}>
      <UltraFeedPostItem 
        post={post} 
        index={-1} 
        postMetaInfo={postMetaInfo} 
        settings={postSettings}
        isHighlightAnimating={postIsAnimating}
      />
    </div>}
    <div className={classes.commentsRoot}>
      {comments.length > 0 && <div className={classes.commentsContainer}>
        <div className={classes.commentsList}>
          <UltraFeedThreadCommentsList
            compressedItems={compressedItems}
            commentMetaInfos={commentMetaInfos}
            commentDisplayStatuses={commentDisplayStatuses}
            highlightStatuses={highlightStatuses}
            commentAuthorsMap={commentAuthorsMap}
            animatingCommentIds={animatingCommentIds}
            visibleComments={visibleComments}
            newReplies={newReplies}
            replyingToCommentId={replyingToCommentId}
            postInitiallyExpanded={postInitiallyExpanded}
            settings={settings}
            threadIndex={index}
            onSetDisplayStatus={setDisplayStatus}
            onPostExpansion={handlePostExpansion}
            onParentHighlight={triggerParentHighlight}
            onReplyClick={handleReplyClick}
            onReplySubmit={handleReplySubmit}
            onReplyCancel={() => setReplyingToCommentId(null)}
            getNavigationProps={getNavigationProps}
            onBranchToggle={handleBranchToggle}
            onNewReplyEdit={handleNewReplyEdit}
          />
        </div>
      </div>}
    </div>
    </AnalyticsContext>
  );
}

export default UltraFeedThreadItem;




