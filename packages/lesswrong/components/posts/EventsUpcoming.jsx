import { Components, registerComponent, registerSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { styles } from './EventsPast';
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
    const { classes, router } = this.props;
    const postsListTerms = {
      view: 'nearbyEvents',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      limit: 20,
      filters: router.location.query && router.location.query.filters || [],
    }

    return <div className={classes.dailyWrapper}>
      <Components.Section title="Upcoming Events">
        <div className={classes.dailyContentWrapper}>
          <Components.PostsList
            terms={postsListTerms}
            showHeader={false} />
        </div>
      </Components.Section>
    </div>
  }
}

EventsUpcoming.displayName = 'EventsUpcoming';
registerComponent('EventsUpcoming', EventsUpcoming, withStyles(styles, {name: "EventsUpcoming"}), withRouter);
