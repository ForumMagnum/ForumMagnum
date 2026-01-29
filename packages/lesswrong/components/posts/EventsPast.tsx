"use client";

import React from 'react';
import {getAfterDefault, getBeforeDefault} from './timeframeUtils'
import { useTimezone } from '../common/withTimezone';
import { forumAllPostsNumDaysSetting } from '@/lib/instanceSettings';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import PostsTimeframeList from "./PostsTimeframeList";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("EventsPast", (theme: ThemeType) => ({
  daily: {
    padding: theme.spacing.unit
  }
}))
const EventsPast = () => {
  const classes = useStyles(styles);
  const { timezone } = useTimezone();
  const numberOfDays = forumAllPostsNumDaysSetting.get();
  const terms: PostsViewTerms = {
    view: 'eventsInTimeRange',
    timeField: 'startTime',
  };

  return (
    <SingleColumnSection>
      <SectionTitle title="Past Events by Day"/>
      <div className={classes.daily}>
        <PostsTimeframeList
          timeframe={'daily'}
          after={getAfterDefault({
            numTimeBlocks: numberOfDays,
            timeBlock: 'day',
            timezone: timezone
          })}
          before={getBeforeDefault({timeBlock: 'day', timezone: timezone})}
          numTimeBlocks={numberOfDays}
          postListParameters={terms}
          shortform="none"
          includeTags={false}
        />
      </div>
    </SingleColumnSection>
  )
}

export default EventsPast;



