import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import { getSetting, Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import classNames from 'classnames';
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

class PostsDailyList extends PureComponent {

  constructor(props) {
    super(props);
    this.loadMoreDays = this.loadMoreDays.bind(this);
    this.dayLoadComplete = this.dayLoadComplete.bind(this);
    this.state = {
      after: props.after,
      before: props.before,
      dim: props.dimWhenLoading,
    };
  }

  // Return a date string for each date which should have a section. This
  // includes all dates in the range
  // TODO(JP): Move to timeframeUtils once that exists
  // TODO(JP): This function is a bit janky, but I'm about to refactor it for
  // timeframe use, so we'll leave it for now
  getDateRange(after, before) {
    const mAfter = moment.utc(after, 'YYYY-MM-DD');
    const mBefore = moment.utc(before, 'YYYY-MM-DD');
    const daysCount = mBefore.diff(mAfter, 'days') + 1;
    const range = _.range(daysCount).map(
      i => moment.utc(before, 'YYYY-MM-DD').subtract(i, 'days')
        .tz(this.props.timezone)
        .format('YYYY-MM-DD')
    );
    return range;
  }

  // variant 1: reload everything each time (works with polling)
  loadMoreDays(e) {
    e.preventDefault();
    const numberOfDays = getSetting('forum.numberOfDays', 10);
    const loadMoreAfter = moment(this.state.after, 'YYYY-MM-DD').subtract(numberOfDays, 'days').format('YYYY-MM-DD');
    this.setState({
      after: loadMoreAfter,
    });
  }

  // Calculating when all the components have loaded looks like a mess of
  // brittleness, we'll just cease to be dim as soon as a single day has loaded
  dayLoadComplete () {
    if (this.state.dim) {
      this.setState({dim: false})
    }
  }

  render() {
    const { classes, postListParameters } = this.props
    const { after, before, dim } = this.state
    const { PostsDay } = Components
    const dates = this.getDateRange(after, before)

    return (
      <div className={classNames({[classes.loading]: dim})}>
        {dates.map((date, index) =>
          <PostsDay
            key={date.toString()}
            date={moment(date)}
            terms={{
              ...postListParameters,
              before: moment(date).format('YYYY-MM-DD'),
              after: moment(date).format('YYYY-MM-DD'),
            }}
            dayLoadComplete={this.dayLoadComplete}
            hideIfEmpty={index===0}
          />
        )}
        <Typography variant="body1" className={classes.loadMore} onClick={this.loadMoreDays}>
          <a>Load More Days</a>
        </Typography>
      </div>
    )
  }
}

registerComponent('PostsDailyList', PostsDailyList,
  withTimezone, withStyles(styles, {name: "PostsDailyList"})
);
