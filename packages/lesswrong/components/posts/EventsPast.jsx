import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import {getAfterDefault, getBeforeDefault} from './timeframeUtils'

const styles = theme => ({
  daily: {
    padding: theme.spacing.unit
  }
})
const EventsPast = ({ classes }) => {
  const { SingleColumnSection, SectionTitle, PostsDailyList } = Components
  const numberOfDays = getSetting('forum.numberOfDays');
  const terms = {
    view: 'pastEvents',
    timeField: 'startTime',
  };

  return (
    <SingleColumnSection>
      <SectionTitle title="Past Events by Day"/>
      <div className={classes.daily}>
        <PostsDailyList
          timeframe={'daily'}
          after={getAfterDefault(numberOfDays, 'day')}
          before={getBeforeDefault('day')}
          postListParameters={terms}
        />
      </div>
    </SingleColumnSection>
  )
}

EventsPast.displayName = 'EventsPast';
registerComponent('EventsPast', EventsPast, withStyles(styles, {name: "EventsPast"}));
