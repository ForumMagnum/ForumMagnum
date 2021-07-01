import React, { PureComponent } from 'react';
import moment from '../../lib/moment-timezone';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { getDateRange, timeframeToTimeBlock, TimeframeType } from './timeframeUtils'
import withTimezone from '../common/withTimezone';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
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

interface ExternalProps {
  after: Date|string
  before: Date|string
  timeframe: TimeframeType,
  numTimeBlocks?: number,
  postListParameters: any,
  dimWhenLoading?: boolean,
  reverse?: boolean,
  displayShortform?: boolean,
  includeTags?: boolean,
}
interface PostsTimeframeListProps extends ExternalProps, WithStylesProps, WithTimezoneProps {
}
interface PostsTimeframeListState {
  // after goes backwards in time when we load more time blocks
  after: Date|string,
  // See below for reasoning behind inclusion
  before: Date|string,
  // Must include timeframe in state if we include after. Although timeframe
  // as stored in state is the same as the timeframe passed down from props
  // 99.999% of the time...
  // > Ok, it's setting the after prop at the same time as the timeframe,
  // but the state is dirty and takes a few milliseconds to catch up,
  // during which time the PTL has asked for 1200 days worth of posts.
  timeframe: TimeframeType,
  dim: boolean,
  displayedNumTimeBlocks: number,
}

class PostsTimeframeList extends PureComponent<PostsTimeframeListProps,PostsTimeframeListState> {
  static defaultProps = {
    includeTags: true,
  };

  constructor(props: PostsTimeframeListProps) {
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
      dim: !!props.dimWhenLoading,
      displayedNumTimeBlocks: props.numTimeBlocks || 10
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
        dim: !!this.props.dimWhenLoading,
      })
    }
  }

  loadMoreTimeBlocks = (e) => {
    e.preventDefault();
    const { timeframe, numTimeBlocks=10, reverse } = this.props
    const timeBlock = timeframeToTimeBlock[timeframe]
    const displayedNumTimeBlocks = this.state.displayedNumTimeBlocks + numTimeBlocks
    if (reverse) {
      // If the list is reversed, down means going later in time
      const loadMoreBefore = moment(this.state.before, 'YYYY-MM-DD')
        .add(numTimeBlocks, timeBlock)
        .format('YYYY-MM-DD');
      this.setState({
        before: loadMoreBefore,
        displayedNumTimeBlocks
      });
    } else {
      // Otherwise, go back earlier in time
      const loadMoreAfter = moment(this.state.after, 'YYYY-MM-DD')
        .subtract(numTimeBlocks, timeBlock)
        .format('YYYY-MM-DD');
      this.setState({
        after: loadMoreAfter,
        displayedNumTimeBlocks
      });
    }
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
    const { timezone, classes, postListParameters, displayShortform, reverse } = this.props
    const { timeframe, after, before, dim, displayedNumTimeBlocks } = this.state
    const { PostsTimeBlock, Typography } = Components

    const timeBlock = timeframeToTimeBlock[timeframe]
    const dates = getDateRange(after, before, timeBlock)
    const orderedDates = reverse ? dates.reverse() : dates

    const renderLoadMoreTimeBlocks = dates.length && dates.length > 1
    return (
      <div className={classNames({[classes.loading]: dim})}>
        {orderedDates.slice(0, displayedNumTimeBlocks).map((date, index) =>
          <PostsTimeBlock
            key={date.toString()+postListParameters?.limit}
            startDate={moment.tz(date, timezone)}
            timeframe={timeframe}
            terms={{
              limit: 16,
              ...postListParameters,
              // NB: 'before', as a parameter for a posts view, is inclusive
              before: moment.tz(date, timezone).endOf(timeBlock),
              after: moment.tz(date, timezone).startOf(timeBlock),
            }}
            timeBlockLoadComplete={this.timeBlockLoadComplete}
            hideIfEmpty={index===0}
            displayShortform={displayShortform}
            includeTags={this.props.includeTags}
          />
        )}
        {renderLoadMoreTimeBlocks && 
          <Typography variant="body1" className={classes.loadMore} onClick={this.loadMoreTimeBlocks}>
            <a>{loadMoreTimeframeMessages[timeframe]}</a>
          </Typography>
        }
      </div>
    )
  }
};

const PostsTimeframeListComponent = registerComponent<ExternalProps>('PostsTimeframeList', PostsTimeframeList, {
  styles,
  hocs: [withTimezone]
});

declare global {
  interface ComponentTypes {
    PostsTimeframeList: typeof PostsTimeframeListComponent
  }
}
