import React from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { registerComponent } from '../../lib/vulcan-lib/components';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';

import classNames from 'classnames';
import { CommentTreeNode } from '../../lib/utils/unflatten';
import withErrorBoundary from '../common/withErrorBoundary'

import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import type { CommentTreeOptions } from '../comments/commentTree';
import { useCurrentUser } from '../common/withUser';
import { isFriendlyUI } from '@/themes/forumTheme';
import { useRecentDiscussionThread } from './useRecentDiscussionThread';
import { useRecentDiscussionViewTracking } from './useRecentDiscussionViewTracking';
import PostsGroupDetails from "../posts/PostsGroupDetails";
import PostsItemMeta from "../posts/PostsItemMeta";
import CommentsNode from "../comments/CommentsNode";
import PostsHighlight from "../posts/PostsHighlight";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: theme.isFriendlyUI ? theme.spacing.unit*2 : theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: theme.borderRadius[theme.isFriendlyUI ? "default" : "small"],
  },
  plainBackground: {
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
    backdropFilter: theme.palette.filters.bannerAdBlur,
  },
  primaryBackground: {
    backgroundColor: theme.palette.background.primaryDim,
  },
  postStyle: theme.typography.postStyle,
  postItem: {
    // position: "absolute",
    // right: "100%",
    paddingBottom:10,
    ...theme.typography.postStyle,
    // width: 300,
    // marginTop: -2,
    // textAlign: "right",
    // marginRight: -theme.spacing.unit
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
    paddingTop: theme.isFriendlyUI ? 12 : 18,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: theme.borderRadius[theme.isFriendlyUI ? "default" : "small"],
    marginBottom: 4,
    
    [theme.breakpoints.down('xs')]: {
      paddingTop: 16,
      paddingLeft: 14,
      paddingRight: 14,
    },
  },
  titleAndActions: {
    display: "flex",
  },
  title: {
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    flexGrow: 1,
    marginTop: 0,
    marginBottom: 8,
    display: "block",
    fontSize: "2rem",
    ...(theme.isFriendlyUI ? {
      fontSize: 22,
      fontWeight: 600,
      lineHeight: 1.25,
      fontFamily: theme.palette.fonts.sansSerifStack,
      marginBottom: 10,
    } : {})
  },
  smallerTitle: {
    fontSize: '1.5rem',
    lineHeight: '1.5em'
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
    marginTop: -8,
  },
  closeButton: {
    padding: 0,
    margin: "-6px 4px 0em 0em",
    width: 32,
    height: 32,
    minHeight: 'unset',
    minWidth: 'unset',
  },
  closeIcon: {
    width: '1em',
    height: '1em',
    color: theme.palette.icon.dim6,
  },
})

const RecentDiscussionThread = ({
  post,
  comments,
  refetch,
  expandAllThreads: initialExpandAllThreads,
  maxLengthWords,
  smallerFonts,
  isSubforumIntroPost,
  commentTreeOptions = {},
  dismissCallback = () => {},
  classes,
}: {
  post: PostsRecentDiscussion,
  comments?: Array<CommentsList>,
  refetch: () => void,
  expandAllThreads?: boolean,
  maxLengthWords?: number,
  smallerFonts?: boolean,
  isSubforumIntroPost?: boolean,
  commentTreeOptions?: CommentTreeOptions,
  dismissCallback?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {
    isSkippable,
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

  const viewTrackingRef = useRecentDiscussionViewTracking({
    documentId: post._id,
    documentType: 'post',
  });

  if (isSkippable) {
    return null
  }

  const highlightClasses = classNames(classes.postHighlight, {
    // TODO verify whether/how this should be interacting with afCommentCount
    [classes.noComments]: post.commentCount === null
  });
  return (
    <div ref={viewTrackingRef} className={classNames(
      classes.root,
      {
        [classes.plainBackground]: !isSubforumIntroPost,
        [classes.primaryBackground]: isSubforumIntroPost
      }
    )}>
      <div className={classNames(
        classes.post,
        {
          [classes.primaryBackground]: isSubforumIntroPost
        }
      )}>
        <div className={classes.postItem}>
          {post.group && <PostsGroupDetails post={post} documentId={post.group._id} inRecentDiscussion={true} />}
          <div className={classes.titleAndActions}>
            <Link to={postGetPageUrl(post)} className={classNames(classes.title, {[classes.smallerTitle]: smallerFonts})} eventProps={{intent: 'expandPost'}}>
              {post.title}
            </Link>
            {isSubforumIntroPost && currentUser ? <Button
              className={classes.closeButton}
              onClick={dismissCallback}
            >
              <CloseIcon className={classes.closeIcon} />
            </Button> : <div className={classes.actions}>
              <PostActionsButton post={post} autoPlace vertical />
            </div>}
          </div>
          <div className={classNames(classes.threadMeta, {[classes.smallerMeta]: smallerFonts})} onClick={showHighlight}>
            <PostsItemMeta post={post} hideTags={!isFriendlyUI()}/>
          </div>
        </div>
        <div className={highlightClasses}>
          <PostsHighlight post={post} maxLengthWords={maxLengthWords ?? lastVisitedAt ? 50 : 170} smallerFonts={smallerFonts} />
        </div>
      </div>
      <div className={classes.content}>
        <div className={classes.commentsList}>
          {!!nestedComments.length && nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
            <div key={comment.item._id}>
              <CommentsNode
                treeOptions={treeOptions}
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
  )
};

export default registerComponent(
  'RecentDiscussionThread', RecentDiscussionThread, {
    styles,
    hocs: [withErrorBoundary],
    areEqual: {
      post: (before, after) => (before?._id === after?._id),
      refetch: "ignore",
    },
  }
);


