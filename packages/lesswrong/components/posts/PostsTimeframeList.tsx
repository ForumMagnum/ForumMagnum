import React, { useState } from 'react';
import moment from '../../lib/moment-timezone';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { getDateRange, loadMoreTimeframeMessages, timeframeToRange, timeframeToTimeBlock, TimeframeType } from './timeframeUtils'
import { useTimezone } from '../common/withTimezone';

import { PostsTimeBlockShortformOption } from './PostsTimeBlock';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { useOnPropsChanged } from '../hooks/useOnPropsChanged';

const styles = (theme: ThemeType) => ({
  loading: {
    opacity: .4,
  },
  loadMore: {
    ...theme.typography.postStyle,
    color: theme.palette.primary.main,
    ...(isFriendlyUI
      ? {
        fontFamily: theme.palette.fonts.sansSerifStack,
      }
      : {}),
  }
})

const PostsTimeframeList = ({ after, before, timeframe, numTimeBlocks, postListParameters, dimWhenLoading, reverse, shortform, includeTags=true, classes }: {
  after: Date|string,
  before: Date|string,
  timeframe: TimeframeType,
  numTimeBlocks: number,
  postListParameters: PostsViewTerms,
  dimWhenLoading?: boolean,
  reverse?: boolean,
  shortform: PostsTimeBlockShortformOption,
  includeTags: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { timezone } = useTimezone();
  const [dim,setDim] = useState(dimWhenLoading);
  const [displayedNumTimeBlocks,setDisplayedNumTimeBlocks] = useState(numTimeBlocks ?? 10);
  const [beforeState,setBeforeState] = useState(before);
  const [afterState,setAfterState] = useState(after);

  useOnPropsChanged(() => {
    setBeforeState(before);
    setAfterState(after);
    setDim(!!dimWhenLoading);
    setDisplayedNumTimeBlocks(numTimeBlocks);
  }, [before, after, timeframe, postListParameters]);
  
  const loadMoreTimeBlocks = (e: React.MouseEvent) => {
    e.preventDefault();
    const pageSize = numTimeBlocks ?? 10;
    const timeBlock = timeframeToTimeBlock[timeframe]
    const newDisplayedNumTimeBlocks = displayedNumTimeBlocks + pageSize;
    if (reverse) {
      // If the list is reversed, down means going later in time
      const loadMoreBefore = moment(beforeState, 'YYYY-MM-DD')
        .add(numTimeBlocks, timeBlock)
        .format('YYYY-MM-DD');
      setBeforeState(loadMoreBefore);
      setDisplayedNumTimeBlocks(newDisplayedNumTimeBlocks);
    } else {
      // Otherwise, go back earlier in time
      const loadMoreAfter = moment(afterState, 'YYYY-MM-DD')
        .subtract(numTimeBlocks, timeBlock)
        .format('YYYY-MM-DD');
      setAfterState(loadMoreAfter);
      setDisplayedNumTimeBlocks(newDisplayedNumTimeBlocks);
    }
  }

  // Calculating when all the components have loaded looks like a mess of
  // brittleness, we'll just cease to be dim as soon as a single timeBlock has
  // loaded
  const timeBlockLoadComplete = () => {
    if (dim) {
      setDim(false);
    }
  }

  const { PostsTimeBlock, Typography } = Components

  const timeBlock = timeframeToTimeBlock[timeframe]
  const dates = getDateRange(afterState, beforeState, timeBlock)
  const orderedDates = reverse ? dates.reverse() : dates

  const renderLoadMoreTimeBlocks = dates.length && dates.length > 1
  
  return (
    <div className={classNames({[classes.loading]: dim})}>
      {orderedDates.slice(0, displayedNumTimeBlocks).map((date, index) => {
        const startDate = moment.tz(date, timezone);
        const { before, after } = timeframeToRange({startDate, timeBlock, timezone});
        return <PostsTimeBlock
          key={date.toString()+postListParameters?.limit}
          dateForTitle={startDate}
          getTitle={(size) => getTimeBlockTitle(startDate, timeframe, size)}
          before={before} after={after}
          timeframe={timeframe}
          terms={{
            limit: 16,
            ...postListParameters,
          }}
          timeBlockLoadComplete={timeBlockLoadComplete}
          hideIfEmpty={index===0}
          shortform={shortform}
          includeTags={includeTags}
        />
      })}
      {renderLoadMoreTimeBlocks &&
        <Typography
          variant="body1"
          className={classes.loadMore}
          onClick={loadMoreTimeBlocks}
        >
          <a>{preferredHeadingCase(loadMoreTimeframeMessages[timeframe])}</a>
        </Typography>
      }
    </div>
  )
};

const isToday = (date: moment.Moment) => date.isSameOrAfter(moment(0, "HH"));

export const getTimeBlockTitle = (
  startDate: moment.Moment,
  timeframe: TimeframeType,
  size: 'xsDown' | 'smUp' | null,
) => {
  if (timeframe === 'yearly') {
    return startDate.format('YYYY');
  }
  if (timeframe === 'monthly') {
    return startDate.format('MMMM YYYY');
  }

  if (isFriendlyUI) {
    const result = size === 'smUp'
      ? startDate.format('ddd, D MMM YYYY')
      : startDate.format('dddd, D MMMM YYYY');
    if (timeframe === 'weekly') {
      return `Week of ${result}`;
    }
    return isToday(startDate) ? result.replace(/.*,/, "Today,") : result;
  }

  const result = size === 'smUp'
    ? startDate.format('ddd, MMM Do YYYY')
    : startDate.format('dddd, MMMM Do YYYY');
  if (timeframe === 'weekly') {
    return `Week Of ${result}`;
  }
  return result;
}

const PostsTimeframeListComponent = registerComponent('PostsTimeframeList', PostsTimeframeList, {styles});

declare global {
  interface ComponentTypes {
    PostsTimeframeList: typeof PostsTimeframeListComponent
  }
}
