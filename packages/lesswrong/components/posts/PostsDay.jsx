import React from 'react';
import PropTypes from 'prop-types';
import { Components, withList, registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginBottom: theme.spacing.unit*4
  },
  dayTitle: {
    whiteSpace: "pre",
    textOverflow: "ellipsis",
    ...theme.typography.postStyle,
    fontWeight: 600
  },
  noPosts: {
    marginLeft: "23px",
    color: "rgba(0,0,0,0.5)",
  },
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

const PostsDay = ({ date, posts, results: comments, totalCount, loadMore, hideIfEmpty, classes, currentUser }) => {
  const noPosts = !posts || (posts.length === 0);
  const noComments = !comments || (comments.length === 0);
  const { PostsItem2, CommentsNode, LoadMore } = Components

  // The most recent day is hidden if there are no posts on it, to avoid having
  // an awkward empty partial day when it's close to midnight.
  if (noPosts && noComments && hideIfEmpty) {
    return null;
  }
  
  return (
    <div className={classes.root}>
      <Typography variant="headline" className={classes.dayTitle}>
        <Hidden xsDown implementation="css">
          {date.format('dddd, MMMM Do YYYY')}
        </Hidden>
        <Hidden smUp implementation="css">
          {date.format('ddd, MMM Do YYYY')}
        </Hidden>
      </Typography>
      
      { (noPosts && noComments) && (<div className={classes.noPosts}>No posts on {date.format('MMMM Do YYYY')}</div>) }
      
      {posts?.map((post, i) =>
        <PostsItem2 key={post._id} post={post} currentUser={currentUser} index={i} />)}
      
      {currentUser?.beta && comments?.length > 0 &&
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
      }
    </div>
  );
}

PostsDay.propTypes = {
  currentUser: PropTypes.object,
  date: PropTypes.object,
};

registerComponent('PostsDay', PostsDay,
  [withList, {
    collection: Comments,
    queryName: 'dailyShortformQuery',
    fragmentName: 'ShortformComments',
    enableTotal: true,
    enableCache: true,
    limit: 3,
    ssr: true,
  }],
  withStyles(styles, { name: "PostsDay" }));
