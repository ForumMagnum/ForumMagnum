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
    marginBottom: isFriendlyUI ? theme.spacing.unit*2 : theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: theme.borderRadius[isFriendlyUI ? "default" : "small"],
    // maxWidth: 700
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
  },
  postHighlight: {
    overflow: "hidden",
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      backgroundColor: "none"
    }
  },
  noComments: {
    paddingBottom: 16
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
  content :{
    marginLeft: 4,
    marginRight: 4,
    paddingBottom: 1
  },
  commentsList: {
    marginTop: 12,
    marginLeft: 12,
    marginBottom: 8,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0,
      marginBottom: 0
    }
  },
  post: {
    paddingTop: isFriendlyUI ? 12 : 18,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: theme.borderRadius[isFriendlyUI ? "default" : "small"],
    marginBottom: 4,
    
    [theme.breakpoints.down('xs')]: {
      paddingTop: 16,
      paddingLeft: 14,
      paddingRight: 14,
    },
  },
  titleAndActions: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
      fontSize: "1.3rem",
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
    // marginTop: -8,
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


  const highlightClasses = classNames(classes.postHighlight, {
    // TODO verify whether/how this should be interacting with afCommentCount
    [classes.noComments]: post.commentCount === null
  });

  const {
    PostsGroupDetails, CommentsNode, FeedPostsHighlight, PostActionsButton, FeedPostCardMeta
  } = Components;
  return (
    <AnalyticsContext pageSubSectionContext='FeedPostCommentsCard'>

      <div className={classNames(classes.root, classes.plainBackground)}>
        <div className={classNames(classes.post, classes.plainBackground)}>
          <div className={classes.cardHeader}>
            {/* TODO: this will break styling probably, need to test with actual example of groups*/}
            {post.group && <PostsGroupDetails post={post} documentId={post.group._id} inRecentDiscussion={true} />}
            <div className={classes.titleAndActions}>
              <Link to={postGetPageUrl(post)} className={classes.title} eventProps={{intent: 'expandPost'}}>
                {post.title}
              </Link>
              <PostActionsButton post={post} autoPlace vertical className={classes.actions} />
            </div>
            <FeedPostCardMeta post={post} />
          </div>

          {post.contents?.wordCount && <div className={highlightClasses}>
            <FeedPostsHighlight 
              post={post} 
              initiallyExpanded={expandPost}
              maxCollapsedLengthWords={lastVisitedAt ? 70 : maxCollapsedLengthWords} 
            />
          </div>}
        </div>

        <div className={classes.content}>
          <div className={classes.commentsList}>
            {nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
              <div key={comment.item._id}>
                <CommentsNode
                  treeOptions={treeOptions}
                  startThreadTruncated={true}
                  expandAllThreads={expandAllThreads}
                  expandNewComments={false}
                  nestingLevel={0}
                  comment={comment.item}
                  childComments={comment.children}
                  key={comment.item._id}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AnalyticsContext>
  )
};

const FeedPostCommentsCardComponent = registerComponent( 'FeedPostCommentsCard', FeedPostCommentsCard, {
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
