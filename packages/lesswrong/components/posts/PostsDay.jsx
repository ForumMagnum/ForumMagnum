import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withCurrentUser, Components, withList, registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment-timezone';
import { Posts } from '../../lib/collections/posts';

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

// TODO; rename
class PostsDay extends Component {

  componentDidUpdate (prevProps) {
    // console.log('pd didUpdate')
    const {networkStatus: prevNetworkStatus} = prevProps
    const {networkStatus, dayLoadComplete, date} = this.props
    // console.log(' date', date)
    // console.log(' prevNetworkStatus', prevNetworkStatus)
    // console.log(' networkStatus', networkStatus)
    // https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
    // 1-4 indicate query is in flight
    // TODO; test for shortform loaded ?
    if (prevNetworkStatus !== networkStatus && ![1, 2, 3, 4].includes(networkStatus) && dayLoadComplete) {
      // console.log(' loading complete for ', date)
      dayLoadComplete() // date
    }
  }

  render () {
    const {
      date, results: posts, totalCount, loading, loadMore, hideIfEmpty, classes, currentUser
    } = this.props
    console.log('PostsDay()')
    console.log(' date', date)
    // console.log(' posts', posts)
    const noPosts = !loading && (!posts || (posts.length === 0))
    const { PostsItem2, LoadMore, ShortformTimeBlock, Loading } = Components

    // The most recent day is hidden if there are no posts on it, to avoid having
    // an awkward empty partial day when it's close to midnight.
    console.log(' hideIfEmpty', hideIfEmpty)
    console.log(' loading, posts.length', loading, posts?.length)
    // TODO; what if there are shortform?
    if (noPosts && hideIfEmpty) {
      return null
    }

    // console.log(' posts.length', posts?.length)
    // console.log(' totalCount', totalCount)

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

        { loading && <Loading /> }

        { noPosts && <div className={classes.noPosts}>No posts on {date.format('MMMM Do YYYY')}</div> }

        {posts?.map((post, i) =>
          <PostsItem2 key={post._id} post={post} currentUser={currentUser} index={i} />)}

        {posts?.length < totalCount && <LoadMore
          loadMore={loadMore}
          count={posts.length}
          totalCount={totalCount}
        />}

        {currentUser?.beta && <ShortformTimeBlock
          terms={{
            view: "topShortform",
            before: moment(date).add(1, 'days').toString(),
            after: moment(date).toString()
          }}
        />}

      </div>
    );
  }

}

PostsDay.propTypes = {
  currentUser: PropTypes.object,
  date: PropTypes.object,
};

// TODO; PR submission note (to remove): This component previously had a withList for the shortform view. Unfortunately, it seems Vulcan does not support multiple withList HOCs on a single component. Thus we have pushed them down into two separate child components <Finish writing this when finished with the refactor>.
registerComponent('PostsDay', PostsDay,
  [withList, {
    collection: Posts,
    queryName: 'postsDailyListQuery',
    fragmentName: 'PostsList',
    enableTotal: true,
    // enable cache?
    limit: 0, // TODO;
    ssr: false, // TODO;
  }],
  withCurrentUser, withStyles(styles, { name: "PostsDay" })
);
