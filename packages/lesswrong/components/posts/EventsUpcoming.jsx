import { Components, registerComponent, registerSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { styles } from './PostsDaily';
import { withRouter } from 'react-router';
import Users from 'meteor/vulcan:users';

registerSetting('forum.numberOfDays', 5, 'Number of days to display in Daily view');

class EventsUpcoming extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      newGroupFormOpen: false,
      newEventFormOpen: false,
      currentUserLocation: Users.getLocation(props.currentUser),
    }
  }

  render() {
    const { classes } = this.props;
    const postsListTerms = {
      view: 'upcomingEvents',
      limit: 20,
    }

    return <div className={classes.dailyWrapper}>
      <Components.Section title="Upcoming Events">
        <div className={classes.dailyContentWrapper}>
          <Components.PostsList terms={postsListTerms} />
        </div>
      </Components.Section>
    </div>
  }
}

EventsUpcoming.displayName = 'EventsUpcoming';
registerComponent('EventsUpcoming', EventsUpcoming, withStyles(styles, {name: "EventsUpcoming"}), withRouter);
