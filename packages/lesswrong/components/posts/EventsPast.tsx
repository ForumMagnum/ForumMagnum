import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import {getAfterDefault, getBeforeDefault} from './timeframeUtils'
import { useTimezone } from '../common/withTimezone';
import { forumAllPostsNumDaysSetting } from '../../lib/publicSettings';

const styles = (theme: ThemeType): JssStyles => ({
  daily: {
    padding: theme.spacing.unit
  }
})
const EventsPast = ({ classes }: {
  classes: ClassesType,
}) => {
  const { timezone } = useTimezone();
  const { SingleColumnSection, SectionTitle, PostsTimeframeList } = Components
  const numberOfDays = forumAllPostsNumDaysSetting.get();
  const terms = {
    view: 'pastEvents',
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
          postListParameters={terms}
          displayShortform={false}
          includeTags={false}
        />
      </div>
    </SingleColumnSection>
  )
}

const EventsPastComponent = registerComponent('EventsPast', EventsPast, {styles});

declare global {
  interface ComponentTypes {
    EventsPast: typeof EventsPastComponent
  }
}

