import React from 'react';
import {
  Components,
  registerComponent,
} from '../../lib/vulcan-lib';

import classNames from 'classnames';
import { CommentTreeNode } from '../../lib/utils/unflatten';
import withErrorBoundary from '../common/withErrorBoundary'

import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import type { CommentTreeOptions } from '../comments/commentTree';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useRecentDiscussionThread } from './useRecentDiscussionThread';

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
})

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
  } = useRecentDiscussionThread({
    post,
    comments,
    refetch,
    commentTreeOptions,
    initialExpandAllThreads,
  });

  const {
    PostsGroupDetails, CommentsNode, FeedPostsHighlight, PostActionsButton, FeedPostCardMeta
  } = Components;

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

        {post.contents?.wordCount
          ? <div className={classNames(classes.postHighlight, { [classes.noComments]: !nestedComments.length })}>
              <FeedPostsHighlight 
                post={post} 
                initiallyExpanded={expandPost}
                maxCollapsedLengthWords={lastVisitedAt ? 70 : maxCollapsedLengthWords} 
              />
            </div>
          : null}

        {nestedComments.length > 0 && <div className={classes.commentsList}>
          {nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
            <div key={comment.item._id}>
              <CommentsNode
                treeOptions={treeOptions}
                startThreadTruncated={true}
                expandAllThreads={expandAllThreads}
                expandNewComments={false}
                comment={comment.item}
                childComments={comment.children}
                key={comment.item._id}
              />
            </div>
          )}
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
