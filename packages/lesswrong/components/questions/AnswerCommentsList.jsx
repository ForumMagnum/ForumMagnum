import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles'
import { unflattenComments } from "../../lib/modules/utils/unflatten";

const styles = theme => ({
  root: {
    paddingLeft: theme.spacing.unit*2,
    borderLeft: "solid 5px rgba(0,0,0,.1)",
    marginLeft: theme.spacing.unit,
  }
})

const AnswerCommentsList = ({results, loading, loadMore, networkStatus, classes, totalCount, post, answerId }) => {

  const { CommentsListSection, Loading } = Components

  const loadingMore = networkStatus === 2;
  if (loading || !results) {
    return <Loading/>
  } else {
    const nestedComments = unflattenComments(results);
    return (
      <div className={classes.root}>
        <CommentsListSection
          comments={nestedComments}
          postId={post._id}
          answerId={answerId}
          lastEvent={post.lastVisitedAt}
          loadMoreComments={loadMore}
          totalComments={totalCount}
          commentCount={results.length}
          loadingMoreComments={loadingMore}
          post={post}
          startThreadCollapsed={true}
        />
      </div>
    );
  }
};

AnswerCommentsList.propTypes = {
  classes: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired,
  answerId: PropTypes.string,
  loading: PropTypes.bool,
  results: PropTypes.array,
};

const listOptions = {
  collection: Comments,
  queryName: 'AnswersCommentListQuery',
  fragmentName: 'CommentsList',
  enableTotal: true,
}

registerComponent('AnswerCommentsList', AnswerCommentsList, [withList, listOptions], withStyles(styles, {name: "AnswerCommentsList"}));
