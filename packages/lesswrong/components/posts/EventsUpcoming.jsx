import { Components, registerComponent} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { styles } from './PostsDaily';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import Users from 'meteor/vulcan:users';
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
