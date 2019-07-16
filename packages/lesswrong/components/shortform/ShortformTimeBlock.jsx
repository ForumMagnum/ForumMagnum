import React from 'react';
import { Components, withList, registerComponent } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  shortformGroup: {
    marginTop: 20,
  },
  shortformTag: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginBottom: 8,
  },
})

const ShortformTimeBlock = ({ totalCount, loadMore, results: comments, classes }) => {
  const { CommentsNode, LoadMore } = Components
  // TODO; return null or something?
  if (!comments?.length) return <div></div>
  return <div>
    <div className={classes.shortformGroup}>
      <div className={classes.shortformTag}>
        Shortform [Beta]
      </div>
      {comments?.map((comment, i) =>
        <CommentsNode
          comment={comment} post={comment.post}
          key={comment._id}
          forceSingleLine loadChildrenSeparately
        />)}
      {comments?.length < totalCount &&
      <LoadMore
        loadMore={loadMore}
        count={comments.length}
        totalCount={totalCount}
      />
      }
    </div>
  </div>
}

registerComponent('ShortformTimeBlock', ShortformTimeBlock,
  [withList, {
    collection: Comments,
    queryName: 'dailyShortformQuery',
    fragmentName: 'ShortformComments',
    enableTotal: true,
    enableCache: true,
    limit: 3,
    ssr: true,
  }],
  withStyles(styles, { name: "PostsDay" })
);
