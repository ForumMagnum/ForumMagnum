import React, { useState, useCallback } from 'react';
import Button from '@material-ui/core/Button';
import { Components, registerComponent, } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary'
import { loadMulti } from '../../lib/crud/withMulti';
import { useRecordPostView } from '../hooks/useRecordPostView';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import type { CommentTreeOptions } from '../comments/commentTree';
import { useCurrentUser } from '../common/withUser';
import CloseIcon from '@material-ui/icons/Close';
import classNames from 'classnames';
import { useApolloClient } from '@apollo/client/react/hooks';
import { isEAForum } from '../../lib/instanceSettings';
import { toDictionary } from '../../lib/utils/toDictionary';
import { userHasCommentPoolInRecentDiscussion } from '../../lib/betas';
import type { CommentExpansionState } from '../comments/CommentPool';
import { unflattenComments, CommentTreeNode } from '../../lib/utils/unflatten';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: isEAForum ? theme.spacing.unit*2 : theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: theme.borderRadius[isEAForum ? "default" : "small"],
  },
  plainBackground: {
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
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
    paddingTop: isEAForum ? 12 : 18,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: theme.borderRadius[isEAForum ? "default" : "small"],
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
    fontSize: "1.75rem",
    ...(isEAForum ? {
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
  refetch: any,
  expandAllThreads?: boolean,
  maxLengthWords?: number,
  smallerFonts?: boolean,
  isSubforumIntroPost?: boolean,
  commentTreeOptions?: CommentTreeOptions,
  dismissCallback?: () => void,
  classes: ClassesType,
}) => {
  const [highlightVisible, setHighlightVisible] = useState(false);
  const [markedAsVisitedAt, setMarkedAsVisitedAt] = useState<Date|null>(null);
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const { recordPostView } = useRecordPostView(post);
  const currentUser = useCurrentUser();
  const postId = post._id;
  const client = useApolloClient();

  const markAsRead = useCallback(
    () => {
      setMarkedAsVisitedAt(new Date());
      setExpandAllThreads(true);
      recordPostView({post, extraEventProperties: {type: "recentDiscussionClick"}})
    },
    [setMarkedAsVisitedAt, setExpandAllThreads, recordPostView, post]
  );
  const showHighlight = useCallback(
    () => {
      setHighlightVisible(!highlightVisible);
      markAsRead();
    },
    [setHighlightVisible, highlightVisible, markAsRead]
  );
  const loadMoreComments = useCallback(async (limit: number): Promise<CommentsList[]> => {
    return await loadMulti({
      client,
      collectionName: "Comments",
      terms: {
        view: "loadMorePostComments",
        postId,
      },
      limit,
      fragmentName: "CommentsList",
    });
  }, [client, postId]);

  const { PostsGroupDetails, PostsItemMeta, CommentPool, PostsHighlight, PostActionsButton, CommentNodeOrPlaceholder } = Components

  const lastCommentId = comments && comments[0]?._id

  const lastVisitedAt = markedAsVisitedAt || post.lastVisitedAt

  // TODO verify whether/how this should be interacting with afCommentCount
  if (comments && !comments.length && post.commentCount != null) {
    // New posts should render (to display their highlight).
    // Posts with at least one comment should only render if that those comments meet the frontpage filter requirements
    return null
  }

  const highlightClasses = classNames(classes.postHighlight, {
    // TODO verify whether/how this should be interacting with afCommentCount
    [classes.noComments]: post.commentCount === null
  })
  
  const treeOptions: CommentTreeOptions = {
    scrollOnExpand: true,
    lastCommentId: lastCommentId,
    highlightDate: lastVisitedAt,
    refetch: refetch,
    condensed: true,
    post: post,
    dontExpandNewComments: true,
    ...commentTreeOptions
  };
  
  const initialExpansion: Partial<Record<string,CommentExpansionState>>|undefined = comments ? toDictionary(comments, c=>c._id, _=>"truncated") : undefined;
  const nestedComments = unflattenComments(comments ?? [], {
    usePlaceholders: userHasCommentPoolInRecentDiscussion(currentUser)
  });


  return (
    <AnalyticsContext pageSubSectionContext='recentDiscussionThread'>
      <div className={classNames(
        classes.root,
        {
          [classes.plainBackground]: !isSubforumIntroPost,
          [classes.primaryBackground]: isSubforumIntroPost
        }
      )}>
        <div className={classNames(
          classes.post,
          {
            [classes.plainBackground]: !isSubforumIntroPost,
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
              <PostsItemMeta post={post}/>
            </div>
          </div>
          <div className={highlightClasses}>
            <PostsHighlight post={post} maxLengthWords={maxLengthWords ?? lastVisitedAt ? 50 : 170} smallerFonts={smallerFonts} />
          </div>
        </div>
        <div className={classes.content}>
          <div className={classes.commentsList}>
            {userHasCommentPoolInRecentDiscussion(currentUser)
              ? <CommentPool
                  initialComments={comments ?? []}
                  initialExpansionState={initialExpansion}
                  topLevelCommentCount={post.topLevelCommentCount}
                  treeOptions={treeOptions}
                  startThreadTruncated
                  expandAllThreads={initialExpandAllThreads || expandAllThreads}
                  loadMoreTopLevel={loadMoreComments}
                  disableTopLevelLoadMore={post.shortform}
                />
              : !!nestedComments.length && nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
                  <div key={comment._id}>
                    <CommentNodeOrPlaceholder
                      treeOptions={treeOptions}
                      treeNode={comment}
                      startThreadTruncated
                      expandAllThreads={initialExpandAllThreads || expandAllThreads}
                      nestingLevel={1}
                      key={comment._id}
                    />
                  </div>
                )
            }
          </div>
        </div>
      </div>
    </AnalyticsContext>
  )
};

const RecentDiscussionThreadComponent = registerComponent(
  'RecentDiscussionThread', RecentDiscussionThread, {
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
    RecentDiscussionThread: typeof RecentDiscussionThreadComponent,
  }
}
