import React, { useMemo, useState, useCallback } from "react";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { DisplayFeedCommentThread, FeedCommentMetaInfo, FeedItemDisplayStatus } from "./ultraFeedTypes";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";
import { UltraFeedCommentItem, UltraFeedCompressedCommentsItem } from "./UltraFeedCommentItem";
import UltraFeedPostItem from "./UltraFeedPostItem";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { userGetDisplayName } from "@/lib/collections/users/helpers";

const PostsListWithVotesQuery = gql(`
  query UltraFeedThreadItem($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
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
  commentsRoot: {
    paddingLeft: 20,
    paddingRight: 16,
    borderRadius: 4,
    background: theme.palette.panelBackground.bannerAdTranslucentHeavy,
    backdropFilter: theme.palette.filters.bannerAdBlurHeavy,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 16,
    },
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
  commentItem: {
    position: 'relative',
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
  postContainer: {
    position: 'relative',
    '&::after': itemSeparator(theme),
  }
}));

type CommentDisplayStatusMap = Record<string, "expanded" | "collapsed" | "hidden">;

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
  
  const { comments, commentMetaInfos } = thread;
  const {captureEvent} = useTracking();
  const [ postExpanded, setPostExpanded ] = useState(false);
  const [animatingCommentIds, setAnimatingCommentIds] = useState<Set<string>>(new Set());
  
  // State for handling new replies (including allowing switching back to original subsequent comments)
  const [newReplies, setNewReplies] = useState<Record<string, UltraFeedComment>>({});
  const [branchViewStates, setBranchViewStates] = useState<Record<string, 'new' | 'original'>>({});
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(startReplyingTo ?? null);
  
  const { loading, data } = useQuery(PostsListWithVotesQuery, {
    variables: { documentId: comments[0].postId ?? undefined },
    skip: !comments[0].postId || !postExpanded,
  });
  const post = data?.post?.result;

  const postMetaInfo = {
    sources: commentMetaInfos?.[comments[0]._id]?.sources ?? [],
    displayStatus: "expanded" as FeedItemDisplayStatus,
    servedEventId: commentMetaInfos?.[comments[0]._id]?.servedEventId ?? '',
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
  
  const [newCommentMetaInfos, setNewCommentMetaInfos] = useState<Record<string, FeedCommentMetaInfo>>({});
  
  const setDisplayStatus = useCallback((commentId: string, newStatus: "expanded" | "collapsed" | "hidden") => {
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
    if (comment?.parentCommentId) {
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
  }, [comments, commentDisplayStatuses, setDisplayStatus, captureEvent]);

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
    
    const defaultMetaInfo: FeedCommentMetaInfo = {
      displayStatus: 'expanded',
      sources: [],
      descendentCount: 0,
      directDescendentCount: 0,
      highlight: false,
      lastServed: new Date(),
      lastViewed: null,
      lastInteracted: new Date(),
      postedAt: newComment.postedAt ? new Date(newComment.postedAt) : new Date(),
    };
    setNewCommentMetaInfos(prev => ({
      ...prev,
      [newComment._id]: defaultMetaInfo
    }));
    
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
      <UltraFeedPostItem post={post} index={-1} postMetaInfo={postMetaInfo} settings={settings}/>
    </div>}
    <div className={classes.commentsRoot}>
      {comments.length > 0 && <div className={classes.commentsContainer}>
        <div className={classes.commentsList}>
          {compressedItems.map((item, commentIndex) => {
            if ("placeholder" in item) {
              const hiddenCount = item.hiddenComments.length;
              
              return (
                <div className={classes.commentItem} key={`placeholder-${commentIndex}`}>
                  <UltraFeedCompressedCommentsItem
                    numComments={hiddenCount}
                    setExpanded={() => {
                      // Always expand max 3 comments at a time
                      item.hiddenComments.slice(0, 3).forEach(h => {
                        setDisplayStatus(h._id, "expanded");
                      });
                    }}
                    isFirstComment={commentIndex === 0}
                    isLastComment={commentIndex === compressedItems.length - 1}
                  />
                </div>
              );
            } else {
              const cId = item._id;
              const isFirstItem = commentIndex === 0;
              const isLastItem = commentIndex === compressedItems.length - 1;
              const parentAuthorName = item.parentCommentId ? commentAuthorsMap[item.parentCommentId] : null;
              const isAnimating = animatingCommentIds.has(cId);
              
              const navigationProps = getNavigationProps(cId, visibleComments);
              
              const isNewReply = Object.values(newReplies).some(reply => reply._id === cId);
              
              return (
                <div key={cId} className={classes.commentItem}>
                  <UltraFeedCommentItem
                    comment={item}
                    metaInfo={{
                      ...commentMetaInfos?.[cId],
                      displayStatus: commentDisplayStatuses[cId] ?? commentMetaInfos?.[cId]?.displayStatus ?? "collapsed"
                    }}
                    onPostTitleClick={handlePostExpansion}
                    onChangeDisplayStatus={(newStatus) => setDisplayStatus(cId, newStatus)}
                    showPostTitle={isFirstItem}
                    highlight={highlightStatuses[cId] || false}
                    isFirstComment={isFirstItem}
                    isLastComment={isLastItem}
                    settings={settings}
                    parentAuthorName={parentAuthorName}
                    onReplyIconClick={() => triggerParentHighlight(cId)}
                    isHighlightAnimating={isAnimating}
                    replyConfig={{
                      isReplying: replyingToCommentId === cId,
                      onReplyClick: () => handleReplyClick(cId),
                      onReplySubmit: (newComment) => handleReplySubmit(cId, newComment),
                      onReplyCancel: () => setReplyingToCommentId(null),
                    }}
                    hasFork={navigationProps.showNav}
                    currentBranch={navigationProps.currentBranch}
                    threadIndex={index}
                    commentIndex={commentIndex}
                    onBranchToggle={() => navigationProps.forkParentId && handleBranchToggle(navigationProps.forkParentId)}
                    onEditSuccess={isNewReply ? handleNewReplyEdit : () => {}}
                  />
                </div>
              );
            }
          })}
        </div>
      </div>}
    </div>
    </AnalyticsContext>
  );
}

export default UltraFeedThreadItem;




