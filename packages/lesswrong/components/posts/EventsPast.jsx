import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import {getAfterDefault, getBeforeDefault} from './timeframeUtils'
import withTimezone from '../common/withTimezone';

const styles = theme => ({
  daily: {
    padding: theme.spacing.unit
  }
})
const EventsPast = ({ timezone, classes }) => {
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

registerComponent('EventsPast', EventsPast, withTimezone, withStyles(styles, {name: "EventsPast"}));
