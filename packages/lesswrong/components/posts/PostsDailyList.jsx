import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import classNames from 'classnames';
import { getDateRange, timeframeToTimeBlock } from './timeframeUtils'

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

class PostsDailyList extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      // after goes backwards in time when we load more time blocks
      after: props.after,
      dim: props.dimWhenLoading,
    };
  }

  componentDidUpdate (prevProps) {
    // If we receive a new `after` or `postListParameters` prop, it's because
    // our parent is asking us to change what we've loaded. Throw away any
    // previous updates to the `after` state and redim for reloading.
    if (
      prevProps.after !== this.props.after ||
      !_.isEqual(prevProps.postListParameters, this.props.postListParameters)
    ) {
      this.setState({
        after: this.props.after,
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
    const { classes, postListParameters, timeframe, before } = this.props
    const { after, dim } = this.state
    const { PostsDay } = Components

    const timeBlock = timeframeToTimeBlock[timeframe]
    const dates = getDateRange(after, before, timeBlock)

    return (
      <div className={classNames({[classes.loading]: dim})}>
        {dates.map((date, index) =>
          <PostsDay
            key={date.toString()}
            startDate={moment(date)}
            timeframe={timeframe}
            terms={{
              ...postListParameters,
              // NB: 'before', as a parameter for a posts view, is inclusive
              before: moment(date).endOf(timeBlock).format('YYYY-MM-DD'),
              after: moment(date).startOf(timeBlock).format('YYYY-MM-DD'),
              limit: 16
            }}
            timeBlockLoadComplete={this.timeBlockLoadComplete}
            hideIfEmpty={index===0}
          />
        )}
        <Typography variant="body1" className={classes.loadMore} onClick={this.loadMoreTimeBlocks}>
          <a>{loadMoreTimeframeMessages[timeframe]}</a>
        </Typography>
      </div>
    )
  }
}

PostsDailyList.propTypes = {
  after: PropTypes.string,
  before: PropTypes.string, // exclusive
};

registerComponent('PostsDailyList', PostsDailyList,
  withStyles(styles, {name: "PostsDailyList"})
);
