import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withCurrentUser, Components, withList, registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment-timezone';
import { Posts } from '../../lib/collections/posts';
import { timeframeToTimeBlock } from './timeframeUtils'

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

class PostsDay extends Component {
  constructor (props) {
    super(props)
    this.reportEmptyShortform = this.reportEmptyShortform.bind(this);
    this.state = {
      noShortform: false
    }
  }

  componentDidMount () {
    const {networkStatus} = this.props
    this.checkLoaded(networkStatus)
  }

  componentDidUpdate (prevProps) {
    const {networkStatus: prevNetworkStatus} = prevProps
    const {networkStatus} = this.props
    if (prevNetworkStatus !== networkStatus) {
      this.checkLoaded(networkStatus)
    }
  }

  checkLoaded (networkStatus) {
    const { dayLoadComplete } = this.props
    // https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
    // 1-4 indicate query is in flight
    if (![1, 2, 3, 4].includes(networkStatus) && dayLoadComplete) {
      dayLoadComplete()
    }
  }

  // Child component needs a way to tell us about the presence of shortforms
  reportEmptyShortform () {
    if (!this.state.noShortform) {
      this.setState({
        noShortform: true
      })
    }
  }

  render () {
    const {
      startDate, results: posts, totalCount, loading, loadMore, hideIfEmpty, classes, currentUser, timeframe
    } = this.props
    const { noShortform } = this.state
    const { PostsItem2, LoadMore, ShortformTimeBlock, Loading } = Components
    const timeBlock = timeframeToTimeBlock[timeframe]

    const noPosts = !loading && (!posts || (posts.length === 0))
    // The most recent day is hidden if there are no posts or shortforms on it,
    // to avoid having an awkward empty partial day when it's close to midnight.
    if (noPosts && (!currentUser?.beta || noShortform) && hideIfEmpty) {
      return null
    }

    return (
      <div className={classes.root}>
        <Typography variant="headline" className={classes.dayTitle}>
          {timeframe === 'yearly' && startDate.format('YYYY')}
          {timeframe === 'monthly' && startDate.format('MMMM YYYY')}
          {['daily', 'weekly'].includes(timeframe) && <div>
            <Hidden xsDown implementation="css">
              {timeframe === 'weekly' && 'Week Of '}
              {startDate.format('dddd, MMMM Do YYYY')}
            </Hidden>
            <Hidden smUp implementation="css">
              {timeframe === 'weekly' && 'Week Of '}
              {startDate.format('ddd, MMM Do YYYY')}
            </Hidden>
          </div>}
        </Typography>

        { loading && <Loading /> }

        { noPosts && <div className={classes.noPosts}>No posts on {startDate.format('MMMM Do YYYY')}</div> }

        {posts?.map((post, i) =>
          <PostsItem2 key={post._id} post={post} currentUser={currentUser} index={i} />)}

        {posts?.length < totalCount && <LoadMore
          loadMore={loadMore}
          count={posts.length}
          totalCount={totalCount}
        />}

        {currentUser?.beta && <ShortformTimeBlock
          reportEmpty={this.reportEmptyShortform}
          terms={{
            view: "topShortform",
            before: moment(startDate).endOf(timeBlock).add(1, 'days').toString(),
            after: moment(startDate).startOf(timeBlock).toString()
          }}
        />}

      </div>
    );
  }

}

PostsDay.propTypes = {
  currentUser: PropTypes.object,
  startDate: PropTypes.object,
};

registerComponent('PostsDay', PostsDay,
  [withList, {
    collection: Posts,
    queryName: 'postsDailyListQuery',
    fragmentName: 'PostsList',
    enableTotal: true,
    enableCache: true,
    ssr: true,
  }],
  withCurrentUser, withStyles(styles, { name: "PostsDay" })
);
