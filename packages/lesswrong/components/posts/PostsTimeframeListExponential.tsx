import React, { useState } from 'react';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import moment from 'moment';
import type { Moment } from 'moment';
import { getTimeBlockTitle } from './PostsTimeframeList';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { loadMoreTimeframeMessages, TimeframeType } from './timeframeUtils';

const styles = (theme: ThemeType): JssStyles => ({
})

interface TimeBlockRange {
  before: Moment
  after: Moment
  // Approximate size of the timeframe (used for things like the empty-list message)
  timeframe: TimeframeType
  // Title on the block, with variants for different screen sizes
  getTitle: (size: 'xsDown' | 'smUp' | null) => string
}

const PostsTimeframeListExponential = ({postListParameters, classes}: {
  postListParameters: PostsViewTerms,
  classes: ClassesType,
}) => {
  const { PostsTimeBlock, Typography } = Components;
  const now = useCurrentTime();
  const [moreMonthsCount,setMoreMonthsCount] = useState(0);
  
  const loadMoreMonths = () => {
    setMoreMonthsCount(moreMonthsCount + 12);
  }

  const timeframes: TimeBlockRange[] = [
    // Today and Yesterday
    {
      after: moment(now).add(-1,'d').startOf('day'),
      before: moment(now).endOf('day'),
      timeframe: "daily",
      getTitle: (size) => preferredHeadingCase("Today and Yesterday"),
    },
    // Past week
    {
      after: moment(now).add(-7,'d').startOf('day'),
      before: moment(now).add(-1,'d').startOf('day'),
      timeframe: "weekly",
      getTitle: (size) => preferredHeadingCase("Past week"),
    },
    // Past two weeks
    {
      after: moment(now).add(-14,'d').startOf('day'),
      before: moment(now).add(-7,'d').startOf('day'),
      timeframe: "weekly",
      getTitle: (size) => preferredHeadingCase("Past 14 days"),
    },
    // Past month
    {
      after: moment(now).add(-31,'d').startOf('day'),
      before: moment(now).add(-14,'d').startOf('day'),
      timeframe: "monthly",
      getTitle: (size) => preferredHeadingCase("Past 31 days"),
    }
  ];
  
  // Past two months, round to earlier month boundary
  const roundedMonthStart = moment(now).add(-31,'d').startOf('month').add(-1,'M');
  timeframes.push({
    after: roundedMonthStart,
    before: moment(now).add(-31,'d').startOf('day'),
    timeframe: "monthly",
    // Not calling preferredHeadingCase because month names are always capitalized
    getTitle: (size) => `Since ${roundedMonthStart.format("MMMM Do")}`,
  });

  // Month-blocks created by clicking Load More
  for (let i=0; i<moreMonthsCount; i++) {
    const monthStart = moment(roundedMonthStart).add(-(i+1),'M');
    const monthEnd = moment(roundedMonthStart).add(-i,'M');
    timeframes.push({
      after: monthStart,
      before: monthEnd,
      timeframe: "monthly",
      getTitle: (size) => getTimeBlockTitle(monthStart, 'monthly', size),
    });
  }

  return <div>
    {timeframes.map((timeframe,i) => <div key={i}>
      <PostsTimeBlock
        dateForTitle={timeframe.after}
        getTitle={timeframe.getTitle}
        before={timeframe.before}
        after={timeframe.after}
        timeframe={timeframe.timeframe}
        terms={{
          ...postListParameters,
          limit: 16
        }}
        timeBlockLoadComplete={()=>{}}
        hideIfEmpty={true}
        shortform="frontpage"
        includeTags={true}
      />
    </div>)}
    <Typography
      variant="body1"
      className={classes.loadMore}
      onClick={loadMoreMonths}
    >
      <a>{preferredHeadingCase(loadMoreTimeframeMessages["monthly"])}</a>
    </Typography>
  </div>
}

const getMultiDayTitle = (
  startDate: moment.Moment,
  endDate: moment.Moment,
  size: 'xsDown' | 'smUp' | null
) => {
  const dayOfWeekFormat = (size==='smUp') ? "dddd" : "ddd";
  return `${startDate.format(dayOfWeekFormat)}-${endDate.format(dayOfWeekFormat)}, ${startDate.format("MMM Do YYYY")}`
}

const PostsTimeframeListExponentialComponent = registerComponent('PostsTimeframeListExponential', PostsTimeframeListExponential, {styles});

declare global {
  interface ComponentTypes {
    PostsTimeframeListExponential: typeof PostsTimeframeListExponentialComponent
  }
}

