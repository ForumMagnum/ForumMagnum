import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { unflattenComments } from "../../lib/utils/unflatten";
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  commentsList: {
    marginLeft: -theme.spacing.unit*1.5,
    marginRight: -theme.spacing.unit*1.5,
  },
  noComments: {
    position: "relative",
    textAlign: "right",
    top:-theme.spacing.unit*8
  },
  noCommentAnswersList: {
    borderTop: 'transparent'
  },
  editor: {
    marginLeft: theme.spacing.unit*4,
    marginTop: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*1.5,
    paddingBottom: theme.spacing.unit*1.5,
    borderTop: `solid 1px ${theme.palette.grey[300]}`
  },
  newComment: {
    padding: theme.spacing.unit*2.5,
    textAlign: 'right',
    color: theme.palette.grey[600]
  },
  loadMore: {
    color: theme.palette.primary.main,
    textAlign: 'right'
  },
  loadingMore: {
    opacity:.7
  },
  canLoadMore: {
    cursor: "pointer"
  }
})

export const ABRIDGE_COMMENT_COUNT = 500;

const AnswerCommentsList = ({classes, post, parentAnswer}: {
  classes: ClassesType,
  post: PostsList,
  parentAnswer: CommentsList,
}) => {
  const [commenting, setCommenting] = React.useState(false);
  const [loadedMore, setLoadedMore] = React.useState(false);
  
  const { loadMore, results, loading, loadingMore, totalCount } = useMulti({
    terms: {
      view: "repliesToAnswer",
      parentAnswerId: parentAnswer._id,
      limit: ABRIDGE_COMMENT_COUNT,
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });
  
  const highlightDate =
    (post?.lastVisitedAt
      && new Date(post.lastVisitedAt))
    || new Date();

  const closeCommentNewForm = React.useCallback(
    () => setCommenting(false),
    [setCommenting]
  );

  const loadMoreComments = React.useCallback(
    (event) => {
      event.stopPropagation()
      if (totalCount! > ABRIDGE_COMMENT_COUNT) {
        setLoadedMore(true);
        loadMore(10000)
      }
    },
    [totalCount, setLoadedMore, loadMore]
  );

  const { CommentsList, Loading, CommentsNewForm, Typography } = Components
  const noComments = (!results || !results.length) && !commenting

  if (loading || !results)
    return <Loading/>
  
  const nestedComments = unflattenComments(results);
  return (
    <div>
      {!commenting && <Typography variant="body2" onClick={()=>setCommenting(true)} className={classNames(classes.newComment)}>
          <a>Add Comment</a>
        </Typography>}
      { commenting &&
          <div className={classes.editor}>
            <CommentsNewForm
              post={post}
              parentComment={parentAnswer}
              prefilledProps={{
                parentAnswerId: parentAnswer._id,
              }}
              successCallback={closeCommentNewForm}
              cancelCallback={closeCommentNewForm}
              type="reply"
            />
          </div>
        }
      <div onClick={loadMoreComments}
        className={classNames(
          classes.commentsList, {
            [classes.noCommentAnswersList]: noComments,
            [classes.loadingMore]: loadingMore,
            [classes.canLoadMore]: !loadedMore && totalCount! > ABRIDGE_COMMENT_COUNT
          }
      )}>
        { loadingMore && <Loading /> }
        <CommentsList
          treeOptions={{
            postPage: true,
            post: post,
            highlightDate: highlightDate,
          }}
          totalComments={totalCount}
          comments={nestedComments}
          parentCommentId={parentAnswer._id}
          parentAnswerId={parentAnswer._id}
          defaultNestingLevel={2}
          startThreadTruncated
        />
      </div>
      {(results.length && results.length < totalCount!) ?
        <Typography variant="body2" onClick={loadMoreComments} className={classes.loadMore}>
          <a>Showing {results.length}/{totalCount} comments. Click to load All.</a>
        </Typography> : null}
    </div>
  );
}

const AnswerCommentsListComponent = registerComponent('AnswerCommentsList', AnswerCommentsList, {styles});

declare global {
  interface ComponentTypes {
    AnswerCommentsList: typeof AnswerCommentsListComponent
  }
}

