import { Components, registerComponent, getSetting, registerSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import moment from 'moment';
import { withStyles } from '@material-ui/core/styles';
import { styles } from './PostsDaily';

registerSetting('forum.numberOfDays', 5, 'Number of days to display in Daily view');

class EventsPast extends Component {
  render() {
    const { classes } = this.props;
    const numberOfDays = getSetting('forum.numberOfDays', 5);
    const terms = {
      view: 'pastEvents',
      timeField: 'startTime',
      after: moment().utc().subtract(numberOfDays - 1, 'days').format('YYYY-MM-DD'),
      before: moment().utc().add(1, 'days').format('YYYY-MM-DD'),
    };

    return <div className={classes.dailyWrapper}>
      <Components.Section title="Past Events by Day">
        <div className={classes.dailyContentWrapper}>
          <Components.PostsDailyList title="Past Events by Day"
            terms={terms} days={numberOfDays}/>
        </div>
      </Components.Section>
    </div>
  }
}

EventsPast.displayName = 'EventsPast';
registerComponent('EventsPast', EventsPast, withStyles(styles, {name: "EventsPast"}));
