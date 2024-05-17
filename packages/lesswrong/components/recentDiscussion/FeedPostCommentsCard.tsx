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
import { useCurrentUser } from '../common/withUser';
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
  postStyle: theme.typography.commentStyle,
  postItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingBottom: 6,
    ...theme.typography.commentStyle,
  },
  continueReading: {
    marginTop:theme.spacing.unit*2,
    marginBottom:theme.spacing.unit*2,
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
  threadMeta: {
    cursor: "pointer",

    "&:hover $showHighlight": {
      opacity: 1
    },
  },
  smallerMeta: {
    '& .PostsItemMeta-info': {
      fontSize: '1rem'
    }
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
  metaAndActions: {
    display: "flex",
    alignItems: "center",
  },
  titleAndLinkIcon: {
    display: "flex",
    alignItems: "center",
  },
  linkPostIcon: {
  },
  linkIcon: {
    height: "0.7rem",
    width: "0.7rem",
  },
  title: {
    ...theme.typography.display2,
    ...theme.typography.commentStyle,
    flexGrow: 1,
    marginTop: 0,
    marginBottom: 8,
    display: "flex",
    fontSize: "1.3rem",
    // color: theme.palette.primary.main,
    flexWrap: "wrap",
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
  const currentUser = useCurrentUser();
  const {
    showHighlight,
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

  const linkpostIcon = <span className={classes.linkPostIcon}>
    <Components.LWTooltip title={<div>Link Post <div><em>(Click to see linked content)</em></div></div>} placement="right">
      <a href={post.url}><Components.ForumIcon icon="Link" className={classes.linkIcon}/></a>
    </Components.LWTooltip>
  </span>

  const {
    PostsGroupDetails, PostsItemMeta, CommentsNode, FeedPostsHighlight, PostActionsButton,
  } = Components;
  return (
    <AnalyticsContext pageSubSectionContext='FeedPostCommentsCard'>

      <div className={classNames(classes.root, classes.plainBackground)}>
        <div className={classNames(classes.post, classes.plainBackground)}>



          <div className={classes.postItem}>
            {/* TODO: this will break styling, need to test with actual example */}
            {post.group && <PostsGroupDetails post={post} documentId={post.group._id} inRecentDiscussion={true} />}
            <div className={classes.titleAndLinkIcon}>
              <Link to={postGetPageUrl(post)} className={classes.title} eventProps={{intent: 'expandPost'}}>
                {post.title}
              </Link>
              {post.url && linkpostIcon}
            </div>
            <div className={classes.metaAndActions}>
              <div className={classNames(classes.threadMeta)} onClick={showHighlight}>
                <PostsItemMeta post={post} hideTags={true} abbreviateAuthorsIfLong />
              </div>
              <div className={classes.actions}>
                <PostActionsButton post={post} autoPlace vertical />
              </div>
            </div>
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
            {!!nestedComments.length && nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
              <div key={comment.item._id}>
                <CommentsNode
                  treeOptions={{...treeOptions, switchAlternatingHighlights: true}}
                  startThreadTruncated={true}
                  expandAllThreads={expandAllThreads}
                  expandNewComments={false}
                  nestingLevel={1}
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
