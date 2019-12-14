import { Components, registerComponent, useMulti } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles'
import { unflattenComments } from "../../lib/modules/utils/unflatten";
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
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

const AnswerCommentsList = ({terms, lastEvent, classes, post, parentAnswer}) => {
  const currentUser = useCurrentUser();
  const [commenting, setCommenting] = React.useState(false);
  const [loadedMore, setLoadedMore] = React.useState(false);
  
  const { loadMore, results, loading, loadingMore, totalCount } = useMulti({
    terms,
    collection: Comments,
    queryName: 'AnswersCommentListQuery',
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });
  
  const highlightDate =
    (lastEvent && lastEvent.properties && lastEvent.properties.createdAt
      && new Date(lastEvent.properties.createdAt))
    || (post && post.lastVisitedAt
      && new Date(post.lastVisitedAt))
    || new Date();

  const closeCommentNewForm = React.useCallback(
    () => setCommenting(false),
    [setCommenting]
  );

  const loadMoreComments = React.useCallback(
    (event) => {
      event.stopPropagation()
      if (totalCount > ABRIDGE_COMMENT_COUNT) {
        setLoadedMore(true);
        loadMore({limit: 10000})
      }
    },
    [totalCount, setLoadedMore, loadMore]
  );

  const { CommentsList, Loading, CommentsNewForm } = Components
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
            [classes.canLoadMore]: !loadedMore && totalCount > ABRIDGE_COMMENT_COUNT
          }
      )}>
        { loadingMore && <Loading /> }
        <CommentsList
          currentUser={currentUser}
          totalComments={totalCount}
          comments={nestedComments}
          highlightDate={highlightDate}
          post={post}
          parentCommentId={parentAnswer._id}
          parentAnswerId={parentAnswer._id}
          defaultNestingLevel={2}
          postPage
          startThreadTruncated
        />
      </div>
      {(results && results.length && results.length < totalCount) ?
        <Typography variant="body2" onClick={loadMoreComments} className={classes.loadMore}>
          <a>Showing {results.length}/{totalCount} comments. Click to load All.</a>
        </Typography> : null}
    </div>
  );
}

AnswerCommentsList.propTypes = {
  classes: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired,
  parentAnswer: PropTypes.object,
};

registerComponent('AnswerCommentsList', AnswerCommentsList, withStyles(styles, {name: "AnswerCommentsList"}));
