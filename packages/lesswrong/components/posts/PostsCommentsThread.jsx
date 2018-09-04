import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { withList, Components, registerComponent } from 'meteor/vulcan:core';
import { Comments } from 'meteor/example-forum';
import { unflattenComments } from "../../lib/modules/utils/unflatten";

const styles = theme => ({
  root: {
    marginTop: '80px',
    marginBottom: '15px'
  },
  loaded: {
    // Comments have a slightly larger width than the post body
    maxWidth: 720
  }
})

class PostsCommentsThread extends PureComponent {
  render() {
    const {loading, results, loadMore, networkStatus, totalCount, post, classes, rowClass} = this.props;
    const loadingMore = networkStatus === 2;
    if (loading || !results) {
      return <div className={classNames(classes.root, rowClass)}><Components.Loading/></div>
    } else {
      const nestedComments = unflattenComments(results);
      return (
        <div className={classNames(classes.root, rowClass, classes.loaded)}>
          <Components.CommentsListSection
            comments={nestedComments}
            postId={post._id}
            lastEvent={post.lastVisitedAt}
            loadMoreComments={loadMore}
            totalComments={totalCount}
            commentCount={results.length}
            loadingMoreComments={loadingMore}
            post={post}
          />
        </div>
      );
    }
  }
}

const options = {
  collection: Comments,
  queryName: 'PostCommentsThreadQuery',
  fragmentName: 'CommentsList',
  // enableCache: true,
  totalResolver: true,
};

registerComponent('PostsCommentsThread', PostsCommentsThread, [withList, options], withStyles(styles));
