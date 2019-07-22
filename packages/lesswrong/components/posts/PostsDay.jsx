import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withCurrentUser, Components, withList, registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment-timezone';
import { Posts } from '../../lib/collections/posts';
import { timeframeToTimeBlock } from './timeframeUtils'
import { queryIsUpdating } from '../common/queryStatusUtils'

const styles = theme => ({
  root: {
    marginBottom: theme.spacing.unit*4
  },
  timeBlockTitle: {
    whiteSpace: "pre",
    textOverflow: "ellipsis",
    ...theme.typography.postStyle,
    fontWeight: 600
  },
  loadMore: {
    marginTop: theme.spacing.unit,
    marginLeft: theme.spacing.unit,
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
    const { timeBlockLoadComplete } = this.props
    // https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
    // 1-4 indicate query is in flight
    if (!queryIsUpdating(networkStatus) && timeBlockLoadComplete) {
      timeBlockLoadComplete()
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

  getTitle (startDate, timeframe, size) {
    if (timeframe === 'yearly') return startDate.format('YYYY')
    if (timeframe === 'monthly') return startDate.format('MMMM YYYY')
    let result = size === 'smUp' ? startDate.format('ddd, MMM Do YYYY') : startDate.format('dddd, MMMM Do YYYY')
    if (timeframe === 'weekly') result = `Week Of ${result}`
    return result
  }

  render () {
    // console.log('PostsDay render()')
    const {
      startDate, results: posts, totalCount, loading, loadMore, hideIfEmpty, classes, currentUser, timeframe, networkStatus
    } = this.props
    const { noShortform } = this.state
    const { PostsItem2, LoadMore, ShortformTimeBlock, Loading } = Components
    const timeBlock = timeframeToTimeBlock[timeframe]

    const noPosts = !loading && (!posts || (posts.length === 0))
    // The most recent timeBlock is hidden if there are no posts or shortforms
    // on it, to avoid having an awkward empty partial timeBlock when it's close
    // to midnight.
    if (noPosts && (!currentUser?.beta || noShortform) && hideIfEmpty) {
      return null
    }

    // console.log(' loading', loading)
    // console.log(' networkstatus',  networkStatus)

    return (
      <div className={classes.root}>
        <Typography variant="headline" className={classes.timeBlockTitle}>
          {['yearly', 'monthly'].includes(timeframe) && <div>
            {this.getTitle(startDate, timeframe, null)}
          </div>}
          {['weekly', 'daily'].includes(timeframe) && <div>
            <Hidden xsDown implementation="css">
              {this.getTitle(startDate, timeframe, 'xsDown')}
            </Hidden>
            <Hidden smUp implementation="css">
              {this.getTitle(startDate, timeframe, 'smUp')}
            </Hidden>
          </div>}
        </Typography>

        { loading && <Loading /> }

        { noPosts && <div className={classes.noPosts}>
          No posts for {
          timeframe === 'daily' ?
            startDate.format('MMMM Do YYYY') :
            // Should be pretty rare. Basically people running off the end of
            // the Forum history on yearly
            `this ${timeBlock}`
          }
        </div> }

        {posts?.map((post, i) =>
          <PostsItem2 key={post._id} post={post} currentUser={currentUser} index={i} />)}

        {posts?.length < totalCount && <div className={classes.loadMore}>
          <LoadMore
            loadMore={loadMore}
            count={posts.length}
            totalCount={totalCount}
            networkStatus={networkStatus}
          />
        </div>}

        {currentUser?.beta && <ShortformTimeBlock
          reportEmpty={this.reportEmptyShortform}
          terms={{
            view: "topShortform",
            // NB: The comments before differs from posts in that before is not
            // inclusive
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
  timeBlockLoadComplete: PropTypes.func,
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
