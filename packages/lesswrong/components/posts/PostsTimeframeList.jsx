import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import classNames from 'classnames';
import { getDateRange, timeframeToTimeBlock } from './timeframeUtils'
import withTimezone from '../common/withTimezone';

const styles = theme => ({
  loading: {
    opacity: .4,
  },
  loadMore: {
    ...theme.typography.postStyle,
    color: theme.palette.primary.main
  }
})

const loadMoreTimeframeMessages = {
  'daily': 'Load More Days',
  'weekly': 'Load More Weeks',
  'monthly': 'Load More Months',
  'yearly': 'Load More Years',
}

class PostsTimeframeList extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      // after goes backwards in time when we load more time blocks
      after: props.after,
      // See below for reasoning behind inclusion
      before: props.before,
      // Must include timeframe in state if we include after. Although timeframe
      // as stored in state is the same as the timeframe passed down from props
      // 99.999% of the time...
      // > Ok, it's setting the after prop at the same time as the timeframe,
      // but the state is dirty and takes a few milliseconds to catch up,
      // during which time the PTL has asked for 1200 days worth of posts.
      timeframe: props.timeframe,
      dim: props.dimWhenLoading,
    };
  }

  componentDidUpdate (prevProps) {
    // If we receive a new `after` or `postListParameters` prop, it's because
    // our parent is asking us to change what we've loaded. Throw away any
    // previous updates to the `after` state and redim for reloading.
    if (
      prevProps.after !== this.props.after ||
       // Next two presumeably redundant, but included for completeness
      prevProps.before !== this.props.before ||
      prevProps.timeframe !== this.props.timeframe ||
      !_.isEqual(prevProps.postListParameters, this.props.postListParameters)
    ) {
      this.setState({
        after: this.props.after,
        before: this.props.before,
        timeframe: this.props.timeframe,
        dim: this.props.dimWhenLoading,
      })
    }
  }

  loadMoreTimeBlocks = (e) => {
    e.preventDefault();
    const { timeframe, numTimeBlocks } = this.props
    const timeBlock = timeframeToTimeBlock[timeframe]
    const loadMoreAfter = moment(this.state.after, 'YYYY-MM-DD')
      .subtract(numTimeBlocks, timeBlock)
      .format('YYYY-MM-DD');
    this.setState({
      after: loadMoreAfter,
    });
  }

  // Calculating when all the components have loaded looks like a mess of
  // brittleness, we'll just cease to be dim as soon as a single timeBlock has
  // loaded
  timeBlockLoadComplete = () => {
    if (this.state.dim) {
      this.setState({dim: false})
    }
  }

  render() {
    const { timezone, classes, postListParameters, displayShortform } = this.props
    const { timeframe, after, before, dim } = this.state
    const { PostsTimeBlock } = Components

    const timeBlock = timeframeToTimeBlock[timeframe]
    const dates = getDateRange(after, before, timeBlock)

    return (
      <div className={classNames({[classes.loading]: dim})}>
        {dates.map((date, index) =>
          <PostsTimeBlock
            key={date.toString()}
            startDate={moment.tz(date, timezone)}
            timeframe={timeframe}
            terms={{
              ...postListParameters,
              // NB: 'before', as a parameter for a posts view, is inclusive
              before: moment.tz(date, timezone).endOf(timeBlock),
              after: moment.tz(date, timezone).startOf(timeBlock),
              limit: 16
            }}
            timeBlockLoadComplete={this.timeBlockLoadComplete}
            hideIfEmpty={index===0}
            displayShortform={displayShortform}
          />
        )}
        <Typography variant="body2" className={classes.loadMore} onClick={this.loadMoreTimeBlocks}>
          <a>{loadMoreTimeframeMessages[timeframe]}</a>
        </Typography>
      </div>
    )
  }
}

PostsTimeframeList.propTypes = {
  after: PropTypes.string,
  before: PropTypes.string, // exclusive
};

registerComponent('PostsTimeframeList', PostsTimeframeList,
  withTimezone,
  withStyles(styles, {name: "PostsTimeframeList"})
);
