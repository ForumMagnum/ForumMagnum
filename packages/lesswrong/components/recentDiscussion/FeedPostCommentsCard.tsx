import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Components,
  registerComponent,
} from '../../lib/vulcan-lib';

import classNames from 'classnames';
import { CommentTreeNode, addGapIndicators, flattenCommentBranch, unflattenComments } from '../../lib/utils/unflatten';
import withErrorBoundary from '../common/withErrorBoundary'
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { AnalyticsContext, useIsInView, useTracking } from "../../lib/analyticsEvents";
import type { CommentTreeOptions } from '../comments/commentTree';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useRecentDiscussionThread } from './useRecentDiscussionThread';
import { useCurrentUser } from '../common/withUser';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

const RECORD_COMMENTS_SEEN_INTERVAL_MS = 800

const styles = (theme: ThemeType) => ({
  root: {
    paddingTop: 24,
    paddingLeft: 24,
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: theme.borderRadius[isFriendlyUI ? "default" : "small"],
    [theme.breakpoints.down('xs')]: {
      paddingTop: 16,
      paddingLeft: 16,
      paddingRight: 0,
    },
  },
  plainBackground: {
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
  },
  cardHeader: {
    display: "flex",
    ...theme.typography.commentStyle,
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingRight: 20
  },
  postHighlight: {
    paddingRight: 40,
    borderRadius: theme.borderRadius["small"],
    marginBottom: 4,
    overflow: "hidden",
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      backgroundColor: "none"
    },
    [theme.breakpoints.down('xs')]: {
      paddingRight: 16,
    }
  },
  postMetaInfo: {
    display: "flex",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    "&:hover $showHighlight": {
      opacity: 1
    },
  },
  showHighlight: {
    opacity: 0,
  },
  post: {
  },
  titleAndActions: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    marginTop: 0,
    display: "flex",
    marginRight: 10,
    fontSize: "1.75rem",
    flexWrap: "wrap",
    flexGrow: 1,
    [theme.breakpoints.down('xs')]: {
      fontSize: "1.5rem",
    }
  },
  actions: {
    "& .PostActionsButton-icon": {
      fontSize: "1.5em",
    },
    opacity: 0.2,
    "&:hover": {
      opacity: 0.4,
    },
    marginRight: -8,
  },
  commentsList: {
    paddingBottom: 16,
    marginRight: 16,
    marginTop: 12,
    [theme.breakpoints.down('xs')]: {
      marginRight: 4,
      paddingBottom: 4
    }
  },
  noComments: {
    paddingBottom: 16
  },
  showChildren: {
    padding: 4,
    paddingLeft: 12,
    ...theme.typography.body2,
    color: theme.palette.lwTertiary.main,
    display: "block",
    fontSize: 14,
  },
})

const FeedPostCommentsBranch = ({ comment, treeOptions, expandAllThreads, classes }: {
  comment: CommentTreeNode<CommentsList>,
  treeOptions: CommentTreeOptions,
  expandAllThreads: boolean,
  classes: ClassesType<typeof styles>
}) => {
  const { CommentsNode } = Components;

  const [expanded, setExpanded] = useState(expandAllThreads);

  const flattenedCommentBranch = flattenCommentBranch(comment);
  let commentBranchWithGaps = flattenedCommentBranch.slice(1);
  let modifiedChildren;
  const { expandOnlyCommentIds } = treeOptions;
  if (!expanded && expandOnlyCommentIds && flattenedCommentBranch.length > 3) {
    commentBranchWithGaps = commentBranchWithGaps.filter(({ _id }, idx) => (
      _id === comment.item._id ||
      expandOnlyCommentIds.has(_id) ||
      (commentBranchWithGaps[idx + 1] && expandOnlyCommentIds.has(commentBranchWithGaps[idx + 1]._id))
    ));
    modifiedChildren = addGapIndicators(unflattenComments(commentBranchWithGaps));
  }
  const extraChildrenCount = Math.max(0, flattenedCommentBranch.length - (commentBranchWithGaps.length + 1));

  const showExtraChildrenButton =
    extraChildrenCount > 0 ? (
      <a className={classes.showChildren} onClick={() => setExpanded(true)}>
        Showing {commentBranchWithGaps.length} of {flattenedCommentBranch.length - 1} replies (Click to show all)
      </a>
    ) : null;

  return <div key={comment.item._id}>
    <CommentsNode
      treeOptions={treeOptions}
      startThreadTruncated={true}
      showExtraChildrenButton={showExtraChildrenButton}
      expandAllThreads={expanded}
      expandNewComments={false}
      comment={comment.item}
      childComments={modifiedChildren ?? comment.children}
      key={comment.item._id}
    />
  </div>
};

const FeedPostCommentsCard = ({
  post,
  comments,
  refetch,
  expandPost,
  expandAllThreads: initialExpandAllThreads,
  maxCollapsedLengthWords=200,
  commentTreeOptions = {},
  classes,
}: {
  post: PostsRecentDiscussion,
  comments?: Array<CommentsList>,
  refetch: () => void,
  expandPost?: boolean,
  expandAllThreads?: boolean,
  maxCollapsedLengthWords?: number,
  commentTreeOptions?: CommentTreeOptions,
  classes: ClassesType<typeof styles>,
}) => {
  const {
    expandAllThreads,
    lastVisitedAt,
    nestedComments,
    treeOptions,
    markCommentsAsRead,
  } = useRecentDiscussionThread({
    post,
    comments,
    refetch,
    commentTreeOptions,
    initialExpandAllThreads,
  });

  const { FeedPostsHighlight, PostActionsButton, FeedPostCardMeta } = Components;

  const { captureEvent } = useTracking()
  const { setNode, entry } = useIsInView({threshold: 0.05, rootMargin: "20px"})
  const [ cardSeenEventSent, setCardSeenEventSent ] = useState(false)
  const currentUser = useCurrentUser()

  const recordCardSeen = useCallback((startIntersection: number)=> {

    if (entry?.isIntersecting) {
      // console.log('in Callback', {isIntersecting: entry.isIntersecting, cardSeenEventSent, postId: post._id})

      const duration = new Date().getTime() - startIntersection

      // !cardSeenEventSent && markCommentsAsRead() TODO: re-enable when ready to test
      captureEvent("feedCardSeen", {"postId": post._id, duration, title: post.title, })
      setCardSeenEventSent(true)
    }
  }, [captureEvent, post, entry?.isIntersecting])


  const throttledRecordCardSeen = useDebouncedCallback(recordCardSeen, {
    rateLimitMs: 1000,
    callOnLeadingEdge: true,
    onUnmount: "callIfScheduled",
    allowExplicitCallAfterUnmount: false,
    noMaxWait: true
  })


  useEffect(() => {

    if (!currentUser || cardSeenEventSent || !entry?.isIntersecting ) {
      return
    }

    const startIntersection = new Date().getTime()

    setInterval(() => throttledRecordCardSeen(startIntersection), RECORD_COMMENTS_SEEN_INTERVAL_MS)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.isIntersecting])

  return (
    <AnalyticsContext pageSubSectionContext='FeedPostCommentsCard'>

      <div className={classNames(classes.root, classes.plainBackground)}>

        <div className={classes.cardHeader}>
          <div className={classes.titleAndActions}>
            <Link to={postGetPageUrl(post)} className={classes.title} eventProps={{intent: 'expandPost'}}>
              {post.title}
            </Link>
            <PostActionsButton post={post} autoPlace vertical className={classes.actions} />
          </div>
          <FeedPostCardMeta post={post} />
        </div>

        <div className={classNames(classes.postHighlight, { [classes.noComments]: !nestedComments.length })}>
            <FeedPostsHighlight 
              post={post} 
              initiallyExpanded={expandPost}
              maxCollapsedLengthWords={lastVisitedAt ? 70 : maxCollapsedLengthWords} 
            />
        </div>

        {nestedComments.length > 0 && <div className={classes.commentsList} onMouseDown={markCommentsAsRead} ref={setNode}>
          {nestedComments.map((comment: CommentTreeNode<CommentsList>) => {
            return <FeedPostCommentsBranch
              key={comment.item._id}
              {...{
                comment,
                treeOptions,
                expandAllThreads,
                classes
              }}
            />;
          })}
        </div>}
      </div>
    </AnalyticsContext>
  )
};

const FeedPostCommentsCardComponent = registerComponent('FeedPostCommentsCard', FeedPostCommentsCard, {
    styles,
    hocs: [withErrorBoundary],
    areEqual: {
      post: (before, after) => (before?._id === after?._id),
      refetch: "ignore",
    },
  }
);

declare global {
  interface ComponentTypes {
    FeedPostCommentsCard: typeof FeedPostCommentsCardComponent,
  }
}
