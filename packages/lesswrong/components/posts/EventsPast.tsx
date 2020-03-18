import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib';
import React from 'react';
import {getAfterDefault, getBeforeDefault} from './timeframeUtils'
import { useTimezone } from '../common/withTimezone';

const styles = theme => ({
  daily: {
    padding: theme.spacing.unit
  }
})
const EventsPast = ({ classes }) => {
  const { timezone } = useTimezone();
  const { SingleColumnSection, SectionTitle, PostsTimeframeList } = Components
  const numberOfDays = getSetting('forum.numberOfDays');
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

