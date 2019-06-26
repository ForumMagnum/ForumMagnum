import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Posts } from '../../lib/collections/posts';
import { withCurrentUser, withList, getSetting, Components, registerComponent } from 'meteor/vulcan:core';
import withTimezone from '../common/withTimezone';
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import {getDatePosts, getDateRange} from './timeframeUtils'


// TODO; probs reverse import direction
import {
  timeframeToTimeBlock,
  getAfterDateDefault,
  getBeforeDateDefault,
  timeframes
} from './AllPostsPage'

const styles = theme => ({
  loading: {
    opacity: .4,
  },
  loadMore: {
    ...theme.typography.postStyle,
    color: theme.palette.primary.main
  }
})

// Useful reading for network status use in this file and elsewhere:
// https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts

import classNames from 'classnames';
class PostsDailyList extends PureComponent {

  constructor(props) {
    super(props);

    console.log('PostsDailyList constructor')
    // console.log('  props', props)
    // TODO; try without
    this.loadMoreTimeBlocks = this.loadMoreTimeBlocks.bind(this);

    if (!timeframes[props.timeframe]) {
      // TODO; this caused hella problems
      // throw new Error(`Invalid timeframe supplied to [TODO; ComponentName] ${props.timeframe}`)
      return
    }

    // console.log(' timeframettb', timeframeToTimeBlock)
    // console.log(' props.timeframe', props.timeframe)
    const timeBlock = timeframeToTimeBlock[props.timeframe]
    const after = props.terms.after || getAfterDateDefault(props.numTimeBlocks, timeBlock)
    const before = props.terms.before || getBeforeDateDefault(timeBlock)
    this.state = {
      rumTimeBlocks: props.numTimeBlocks,
      blocksLoaded: props.numTimeBlocks,
      // TODO; doc
      afterLoaded: after,
      after,
      before,
      timeBlock,
    };
    // console.log(' state', this.state)
  }

  // intercept prop change and only show more days once data is done loading
  // TODO; can we get rid of UNSAFE
  // TODO; change properly on month change
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.networkStatus === 2) {
      //this.setState({loading: true});
    } else {
      this.setState((prevState, props) => ({
        //loading: false,
        blocksLoaded: prevState.numTimeBlocks,
        afterLoaded: prevState.after,
      }));
    }
    if (nextProps.timeframe !== this.props.timeframe) {
      this.setState({timeBlock: timeframeToTimeBlock[nextProps.timeframe]})
    }
  }

  // TODO; remove
  groupByDate(posts) {
    const { timeField } = this.props.terms

    return _.groupBy(posts, post =>
      moment(new Date(timeField ? post[timeField] : post.postedAt))
        .tz(this.props.timezone)
        .format('YYYY-MM-DD'));
  }

  // TODO; solve this variant shit
  // variant 1: reload everything each time (works with polling)
  loadMoreTimeBlocks(e) {
    e.preventDefault();
    // TODO; why not use state?
    const numberOfTimeBlocks = getSetting('forum.numberOfDays', 5);
    const loadMoreAfter = moment(this.state.after, 'YYYY-MM-DD').subtract(numberOfTimeBlocks, this.state.timeBlock).format('YYYY-MM-DD');

    this.props.loadMore({
      ...this.props.terms,
      after: loadMoreAfter,
    });

    this.setState({
      numTimeBlocks: this.state.numTimeBlocks + this.props.increment,
      after: loadMoreAfter,
    });
  }

  // variant 2: only load new data (need to disable polling)
  loadMoreDaysInc(e) {
    e.preventDefault();
    const numberOfTimeBlocks = getSetting('forum.numTimeBlocks', 5);
    const loadMoreAfter = moment(this.state.after, 'YYYY-MM-DD').subtract(numberOfTimeBlocks, this.state.timeBlock).format('YYYY-MM-DD');
    const loadMoreBefore = moment(this.state.after, 'YYYY-MM-DD').subtract(1, this.state.timeBlock).format('YYYY-MM-DD');

    this.props.loadMoreInc({
      ...this.props.terms,
      before: loadMoreBefore,
      after: loadMoreAfter,
    });

    this.setState((prevState) => ({
        numTimeBlocks: prevState.numTimeBlocks + this.props.increment,
        after: loadMoreAfter,
      })
    );
  }

  render() {
    const {
      timeframe, dimWhenLoading, loading, loadingMore, classes, currentUser, networkStatus, timezone, timeField
    } = this.props
    console.log('PostsDailyList render()')
    // console.log('  props subset', {loading, loadingMore, networkStatus})
    if (!timeframes[this.props.timeframe]) {
      throw new Error(`Invalid timeframe supplied to [TODO; ComponentName]: '${this.props.timeframe}'`)
    }
    const posts = this.props.results;
    const { timeBlock } = this.state
    const dates = getDateRange(this.state.afterLoaded, this.state.before, posts, timeBlock, timeField, timezone);
    const { Loading, PostsDay } = Components
    const loadMoreMessageId = {
      daily: "posts.load_more_days",
      monthly: "posts.load_more_months",
    }[timeframe]

    const dim = dimWhenLoading && networkStatus !== 7

    if (loading && (!posts || !posts.length)) {
      return <Loading />
    }
    //
    // const titlesAndDates = posts
      // .map(post => ({title: post.title, postedAt: post.postedAt.slice(0, post.postedAt.indexOf('T'))}))
      // .sort((a, b) => {
      //   if (a.postedAt === b.postedAt) return 0
      //   if (a.postedAt < b.postedAt) return 1
      //   return 1
      // })
    // console.log('titlesAndDates', titlesAndDates)
    console.log('posts', posts)
    console.log('----')
    //
    return (
      <div className={classNames({[classes.loading]: dim})}>
        { loading && <Loading />}
        {dates.map((date) => {
          console.log('dates map date', date)
          return <PostsDay key={date.toString()}
            date={moment(date)}
            posts={getDatePosts(posts, date, timeBlock, timeField, timezone)}
            networkStatus={networkStatus}
            currentUser={currentUser}
          />
        })}
        {loadingMore ?
          <Loading />
          :
          <Typography variant="body1" className={classes.loadMore} onClick={this.loadMoreTimeBlocks}>
            <a><FormattedMessage id={loadMoreMessageId}/></a>
          </Typography>
        }
      </div>
    )
  }
}

PostsDailyList.propTypes = {
  timeframe: PropTypes.string,
  currentUser: PropTypes.object,
  numTimeBlocks: PropTypes.number,
  increment: PropTypes.number,
};

PostsDailyList.defaultProps = {
  // TODO; maybe register setting
  timeframe: 'daily',
  numTimeBlocks: getSetting('forum.numTimeBlocks', 5),
  increment: getSetting('forum.numTimeBlocks', 5)
};

const options = {
  collection: Posts,
  queryName: 'postsDailyListQuery',
  fragmentName: 'PostsList',
  limit: 0,
  ssr: false, // TODO; temporary
};

registerComponent('PostsDailyList', PostsDailyList, withCurrentUser, [withList, options], withTimezone, withStyles(styles, {name: "PostsDailyList"}));
