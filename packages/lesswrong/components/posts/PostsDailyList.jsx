import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import { getSetting, Components, registerComponent } from 'meteor/vulcan:core';
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
    console.log('PostsDailyList render()')
    const { classes, postListParameters, timeframe } = this.props
    const { after, before, dim } = this.state
    const { PostsDay } = Components
    // console.log(' timeframe', timeframe)
    const timeBlock = timeframeToTimeBlock[timeframe]
    // console.log(' timeBlock', timeBlock)
    const dates = getDateRange(after, before, timeBlock)
    console.log(' dates', dates)

    return (
      <div className={classNames({[classes.loading]: dim})}>
        {dates.map((date, index) =>
          <PostsDay
            key={date.toString()}
            startDate={moment(date)}
            timeframe={timeframe}
            terms={{
              ...postListParameters,
              before: moment(date).endOf(timeBlock).format('YYYY-MM-DD'),
              after: moment(date).startOf(timeBlock).format('YYYY-MM-DD'),
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
  after: PropTypes.string,
  before: PropTypes.string, // exclusive
};

registerComponent('PostsDailyList', PostsDailyList,
  withStyles(styles, {name: "PostsDailyList"})
);
