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
    // TODO; why do we need this?
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
  // TODO; move to timeframeUtils
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
    console.log('load more days()')
    e.preventDefault();
    const numberOfDays = getSetting('forum.numberOfDays', 5);
    const loadMoreAfter = moment(this.state.after, 'YYYY-MM-DD').subtract(numberOfDays, 'days').format('YYYY-MM-DD');
    console.log('newAfter', loadMoreAfter)

    this.setState({
      after: loadMoreAfter,
      // dim: props.dimWhenLoading Nah, right?
      // datesLoading: this.getDateRange(after, moment.utc(this.state.after, 'YYYY-MM-DD').format('YYYY-MM-DD'))
    });
  }

  // Calculating when all the components have loaded looks like a mess of
  // brittleness, we'll just cease to be dim as soon as a single day has loaded
  dayLoadComplete () {
    // TODO; timeout?
    if (this.state.dim) {
      this.setState({dim: false})
    }
  }

  render() {
    console.log('PostsDailyList render()')
    // TODO; where should we actually get terms
    const { classes, timeframe, postListParameters } = this.props
    const { after, before, dim } = this.state
    // TODO; remove let
    let dates = this.getDateRange(after, before);
    // dates = dates.slice(0, 2)
    // console.log('dates', dates)
    const { PostsDay } = Components

    // console.log(' dim', dim)
    // console.log(' postListParameters', postListParameters)

    return (
      <div className={classNames({[classes.loading]: dim})}>
        {dates.map((date, index) =>
          <PostsDay
            key={date.toString()}
            date={moment(date)}
            terms={{
              view: 'timeframe',
              timeframe,
              ...postListParameters,
              // TODO; test with timezones
              before: moment(date).format('YYYY-MM-DD'), // TODO; .add(1, 'days') ????
              after: moment(date).format('YYYY-MM-DD'),
              // limit: 1
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

PostsDailyList.propTypes = {
  currentUser: PropTypes.object,
  days: PropTypes.number,
  increment: PropTypes.number
};

PostsDailyList.defaultProps = {
  days: getSetting('forum.numberOfDays', 5),
  increment: getSetting('forum.numberOfDays', 5)
};

registerComponent('PostsDailyList', PostsDailyList,
  withTimezone, withStyles(styles, {name: "PostsDailyList"})
);
