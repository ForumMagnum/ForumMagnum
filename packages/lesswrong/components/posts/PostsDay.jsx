import React from 'react';
import PropTypes from 'prop-types';
import { Components, withList, registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment-timezone';

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
})

const PostsDay = ({ date, posts, results: comments, totalCount, loadMore, hideIfEmpty, classes, currentUser }) => {
  const noPosts = !posts || (posts.length === 0);
  const noComments = !comments || (comments.length === 0);
  const { PostsItem2, CommentsNode, LoadMore, ShortformTimeBlock } = Components
  // TODO; load more button if timeframe > day

  // The most recent day is hidden if there are no posts on it, to avoid having
  // an awkward empty partial day when it's close to midnight.
  // TODO; how to tell if empty
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
      
      {currentUser?.beta && <ShortformTimeBlock
        terms={{
          view: "topShortform",
          before: moment(date).add(1, 'days').toString(),
          after: moment(date).toString().toString()
        }}
      />}

    </div>
  );
}

PostsDay.propTypes = {
  currentUser: PropTypes.object,
  date: PropTypes.object,
};

// TODO; PR submission note (to remove): This component previously had a withList for the shortform view. Unfortunately, it seems Vulcan does not support multiple withList HOCs on a single component. Thus we have pushed them down into two separate child components <Finish writing this when finished with the refactor>.
registerComponent('PostsDay', PostsDay,
  withStyles(styles, { name: "PostsDay" })
);
