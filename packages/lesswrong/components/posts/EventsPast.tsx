import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import {getAfterDefault, getBeforeDefault} from './timeframeUtils'
import { useTimezone } from '../common/withTimezone';
import { forumAllPostsNumDaysSetting } from '../../lib/publicSettings';
import { SingleColumnSection } from "../common/SingleColumnSection";
import { SectionTitle } from "../common/SectionTitle";
import { PostsTimeframeList } from "./PostsTimeframeList";

const styles = (theme: ThemeType) => ({
  daily: {
    padding: theme.spacing.unit
  }
})
const EventsPastInner = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
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

export const EventsPast = registerComponent('EventsPast', EventsPastInner, {styles});

declare global {
  interface ComponentTypes {
    EventsPast: typeof EventsPast
  }
}

