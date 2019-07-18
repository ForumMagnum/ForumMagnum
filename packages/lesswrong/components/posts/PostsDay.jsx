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

class PostsDay extends Component {
  constructor (props) {
    super(props)
    this.reportEmptyShortform = this.reportEmptyShortform.bind(this);
    this.state = {
      noShortform: false
    }
  }

  componentDidUpdate (prevProps) {
    const {networkStatus: prevNetworkStatus} = prevProps
    const {networkStatus, dayLoadComplete} = this.props
    // https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
    // 1-4 indicate query is in flight
    if (prevNetworkStatus !== networkStatus && ![1, 2, 3, 4].includes(networkStatus) && dayLoadComplete) {
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
    // TODO; can we use property name?
    const {
      date, results: posts, totalCount, loading, loadMore, hideIfEmpty, classes, currentUser
    } = this.props
    const { noShortform } = this.state
    const { PostsItem2, LoadMore, ShortformTimeBlock, Loading } = Components

    let debug = false
    if (this.props.terms.before === '2019-07-07') {
      debug = true
    }
    debug && console.log('PostsDay render() date', date)
    debug && console.log(' ns', this.props.networkStatus)
    debug && console.log(' loading', loading)
    debug && console.log(' error', this.props.error)
    debug && console.log(' data', this.props.data)

    const noPosts = !loading && (!posts || (posts.length === 0))
    // The most recent day is hidden if there are no posts or shortforms on it,
    // to avoid having an awkward empty partial day when it's close to midnight.
    if (noPosts && (!currentUser?.beta || noShortform) && hideIfEmpty) {
      return null
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
          reportEmpty={this.reportEmptyShortform}
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
