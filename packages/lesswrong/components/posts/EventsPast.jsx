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
          after={getAfterDefault(numberOfDays, 'day')}
          before={getBeforeDefault('day')}
          postListParameters={terms}
          displayShortform={false}
        />
      </div>
    </SingleColumnSection>
  )
}

registerComponent('EventsPast', EventsPast, withStyles(styles, {name: "EventsPast"}));
