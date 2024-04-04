import React from 'react';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import moment, { Moment } from 'moment';
import { getTimeBlockTitle } from './PostsTimeframeList';

const styles = (theme: ThemeType): JssStyles => ({
})

interface TimeBlockRange {
  before: Moment
  after: Moment
  getTitle: (size: 'xsDown' | 'smUp' | null) => string
}

const PostsTimeframeListExponential = ({classes}: {
  classes: ClassesType,
}) => {
  const { PostsTimeBlock } = Components;
  const now = useCurrentTime();

  const timeframes: TimeBlockRange[] = [
    // Today
    {
      after: moment(now).startOf('day'),
      before: moment(now).endOf('day'),
      getTitle: (size) => "Today",
    },
    // Yesterday
    {
      after: moment(now).add(-1,'d').startOf('day'),
      before: moment(now).add(-1,'d').endOf('day'),
      getTitle: (size) => getTimeBlockTitle(moment(now).add(-1,'d'), 'daily', size),
    },
    // Day Before Yesterday
    {
      after: moment(now).add(-2,'d').startOf('day'),
      before: moment(now).add(-2,'d').endOf('day'),
      getTitle: (size) => getTimeBlockTitle(moment(now).add(-2,'d'), 'daily', size),
    },
    // Three days before that
    {
      after: moment(now).add(-5,'d').startOf('day'),
      before: moment(now).add(-3,'d').endOf('day'),
      getTitle: (size) => getMultiDayTitle(moment(now).add(-5,'d'), moment(now).add(-2,'d'), size),
    },
    // Preceding week
    {
      after: moment(now).add(-12,'d').startOf('day'),
      before: moment(now).add(-5,'d').endOf('day'),
      getTitle: (size) => getTimeBlockTitle(moment(now).add(-12,'d'), 'weekly', size),
    },
    // Preceding week
    {
      after: moment(now).add(-19,'d').startOf('day'),
      before: moment(now).add(-12,'d').endOf('day'),
      getTitle: (size) => getTimeBlockTitle(moment(now).add(-19,'d'), 'weekly', size),
    },
    // Preceding month
    // Preceding month
  ];
  return <div>
    {timeframes.map((timeframe,i) => <div key={i}>
      <PostsTimeBlock
        dateForTitle={timeframe.after}
        getTitle={timeframe.getTitle}
        before={timeframe.before}
        after={timeframe.after}
        timeframe="weekly"
        terms={{
          limit: 16
        }}
        timeBlockLoadComplete={()=>{}}
        hideIfEmpty={true}
        shortform="frontpage"
        includeTags={true}
      />
    </div>)}
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

