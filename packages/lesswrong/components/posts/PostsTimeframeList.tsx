import React, { useState } from 'react';
import moment from '../../lib/moment-timezone';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { getDateRange, timeframeToTimeBlock, TimeframeType } from './timeframeUtils'
import { useTimezone } from '../common/withTimezone';

import { PostsTimeBlockShortformOption } from './PostsTimeBlock';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
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

const loadMoreTimeframeMessages = {
  'daily': 'Load More Days',
  'weekly': 'Load More Weeks',
  'monthly': 'Load More Months',
  'yearly': 'Load More Years',
}

const PostsTimeframeList = ({ after, before, timeframe, numTimeBlocks, postListParameters, dimWhenLoading, reverse, shortform, includeTags=true, classes }: {
  after: Date|string,
  before: Date|string,
  timeframe: TimeframeType,
  numTimeBlocks?: number,
  postListParameters: PostsViewTerms,
  dimWhenLoading?: boolean,
  reverse?: boolean,
  shortform?: PostsTimeBlockShortformOption,
  includeTags?: boolean,
  classes: ClassesType,
}) => {
  const { timezone } = useTimezone();
  const [dim,setDim] = useState(dimWhenLoading);
  const [displayedNumTimeBlocks,setDisplayedNumTimeBlocks] = useState(numTimeBlocks ?? 10);
  const [beforeState,setBeforeState] = useState(before);
  const [afterState,setAfterState] = useState(after);

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

  const render = () => {
    const { PostsTimeBlock, Typography } = Components

    const timeBlock = timeframeToTimeBlock[timeframe]
    const dates = getDateRange(afterState, beforeState, timeBlock)
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
            }}
            timeBlockLoadComplete={timeBlockLoadComplete}
            hideIfEmpty={index===0}
            shortform={shortform}
            includeTags={includeTags}
          />
        )}
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
  }
  return render();
};

const PostsTimeframeListComponent = registerComponent('PostsTimeframeList', PostsTimeframeList, {styles});

declare global {
  interface ComponentTypes {
    PostsTimeframeList: typeof PostsTimeframeListComponent
  }
}
