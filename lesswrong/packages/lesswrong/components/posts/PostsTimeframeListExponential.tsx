import React, { useState } from 'react';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import moment from 'moment';
import type { Moment } from 'moment';
import { getTimeBlockTitle } from './PostsTimeframeList';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { loadMoreTimeframeMessages, TimeframeType } from './timeframeUtils';
import PostsTimeBlock from "@/components/posts/PostsTimeBlock";
import { Typography } from "@/components/common/Typography";

interface TimeBlockRange {
  before: Moment
  after: Moment
  // Approximate size of the timeframe (used for things like the empty-list message)
  timeframe: TimeframeType
  // Title on the block, with variants for different screen sizes
  getTitle: (size: 'xsDown' | 'smUp' | null) => string
}

const PostsTimeframeListExponential = ({postListParameters}: {
  postListParameters: PostsViewTerms,
}) => {
  const now = useCurrentTime();
  const [moreMonthsCount,setMoreMonthsCount] = useState(0);
  
  const loadMoreMonths = () => {
    setMoreMonthsCount(moreMonthsCount + 12);
  }

  const timeframes: TimeBlockRange[] = [
    // Today and Yesterday
    {
      after: moment(now).add(-24,'hours').startOf('day'),
      before: moment(now).endOf('day'),
      timeframe: "daily",
      getTitle: (_size) => preferredHeadingCase("Today and Yesterday"),
    },
    // Past week
    {
      after: moment(now).add(-7*24,'hours').startOf('day'),
      before: moment(now).add(-24,'hours').startOf('day'),
      timeframe: "weekly",
      getTitle: (_size) => preferredHeadingCase("Past week"),
    },
    // Past two weeks
    {
      after: moment(now).add(-14*24,'hours').startOf('day'),
      before: moment(now).add(-7*24,'hours').startOf('day'),
      timeframe: "weekly",
      getTitle: (_size) => preferredHeadingCase("Past 14 days"),
    },
    // Past month
    {
      after: moment(now).add(-31*24,'hours').startOf('day'),
      before: moment(now).add(-14*24,'hours').startOf('day'),
      timeframe: "monthly",
      getTitle: (_size) => preferredHeadingCase("Past 31 days"),
    }
  ];
  
  // Past two months, round to earlier month boundary
  const roundedMonthStart = moment(now).add(-31*24,'hours').startOf('month').add(-1,'M');
  timeframes.push({
    after: roundedMonthStart,
    before: moment(now).add(-31*24,'hours').startOf('day'),
    timeframe: "monthly",
    // Not calling preferredHeadingCase because month names are always capitalized
    getTitle: (_size) => `Since ${roundedMonthStart.format("MMMM Do")}`,
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
      onClick={loadMoreMonths}
    >
      <a>{preferredHeadingCase(loadMoreTimeframeMessages["monthly"])}</a>
    </Typography>
  </div>
}

const PostsTimeframeListExponentialComponent = registerComponent('PostsTimeframeListExponential', PostsTimeframeListExponential);

declare global {
  interface ComponentTypes {
    PostsTimeframeListExponential: typeof PostsTimeframeListExponentialComponent
  }
}

export default PostsTimeframeListExponentialComponent;

