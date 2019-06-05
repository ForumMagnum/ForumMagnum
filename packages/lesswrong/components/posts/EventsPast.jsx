import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  daily: {
    padding: theme.spacing.unit
  }
})
const EventsPast = ({ classes }) => {
  const { SingleColumnSection, SectionTitle, PostsDailyList } = Components
  const numberOfDays = getSetting('forum.numberOfDays', 5);
  const terms = {
    view: 'pastEvents',
    timeField: 'startTime',
    after: moment().utc().subtract(numberOfDays - 1, 'days').format('YYYY-MM-DD'),
    before: moment().utc().add(1, 'days').format('YYYY-MM-DD'),
  };

  return (
    <SingleColumnSection>
      <SectionTitle title="Past Events by Day"/>
      <div className={classes.daily}>
        <PostsDailyList terms={terms} days={numberOfDays}/>
      </div>
    </SingleColumnSection>
  )
}

EventsPast.displayName = 'EventsPast';
registerComponent('EventsPast', EventsPast, withStyles(styles, {name: "EventsPast"}));
