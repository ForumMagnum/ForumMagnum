import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const numberOfDays = getSetting('forum.numberOfDays', 5);
const styles = theme => ({
  daily: {
    padding: theme.spacing.unit
  }
})

const EventsUpcoming = ({ classes }) => {
  const { SingleColumnSection, SectionTitle, PostsList2 } = Components
  const terms = { view: 'upcomingEvents', limit: 20 }

  return (
    <SingleColumnSection>
      <SectionTitle title="Upcoming Events"/>
      <PostsList2 terms={terms} days={numberOfDays}/>
    </SingleColumnSection>
  )
}

registerComponent('EventsUpcoming', EventsUpcoming, withStyles(styles, {name: "EventsUpcoming"}));
