import { Components, registerComponent, withCurrentUser, getFragment, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { LocalGroups } from '../../lib/index.js';
import { LocalEvents } from '../../lib/index.js';
import Dialog from 'material-ui/Dialog';

const localGroupColumns = [
  'name',
  'location'
]

class CommunityHome extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      newGroupFormOpen: false,
      newEventFormOpen: false,
      currentUserLocation: {lat: 37.871853, lng: -122.258423},
    }
  }

  componentDidMount() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.setState({
          currentUserLocation: {lat: position.coords.latitude, lng: position.coords.longitude}
        })
      });
    }
  }

  handleOpenNewGroupForm = () => {
    this.setState({
      newGroupFormOpen: true,
    })
  }

  handleCloseNewGroupForm = () => {
    this.setState({
      newGroupFormOpen: false,
    })
  }

  handleOpenNewEventForm = () => {
    this.setState({
      newEventFormOpen: true,
    })
  }

  handleCloseNewEventForm = () => {
    this.setState({
      newEventFormOpen: false,
    })
  }

  renderNewGroupForm = () => {
    return (
      <Dialog
        contentStyle={{maxWidth:"400px"}}
        title="New Local Group Form"
        open={this.state.newGroupFormOpen}
        onRequestClose={this.handleCloseNewGroupForm}
        className="comments-item-text new-local-group-form"
        bodyClassName="new-local-group-form-body"
        autoScrollBodyContent
      >
        <Components.SmartForm
          collection={LocalGroups}
          mutationFragment={getFragment('localGroupsHomeFragment')}
          prefilledProps={{organizerIds: [this.props.currentUser._id]}}
          successCallback={localGroup => {
            this.handleCloseNewEventForm();
            this.props.flash("Successfully created new local group " + localGroup.name);
          }}
        />
      </Dialog>
    )
  }

  renderNewEventForm = () => {
    return (
      <Dialog
        contentStyle={{maxWidth:"400px"}}
        title="New Local Event Form"
        open={this.state.newEventFormOpen}
        onRequestClose={this.handleCloseNewEventForm}
        className="comments-item-text new-local-event-form"
        bodyClassName="new-local-event-form-body"
        autoScrollBodyContent
      >
        <Components.SmartForm
          collection={LocalEvents}
          mutationFragment={getFragment('localEventsHomeFragment')}
          prefilledProps={{organizerIds: [this.props.currentUser._id]}}
          successCallback={localEvent => {
            this.handleCloseNewEventForm();
            this.props.flash("Successfully created new local event " + localEvent.name);
          }}
        />
      </Dialog>
    )
  }

  render() {
    return (
      <div className="community-home">
        <Components.CommunityMapWrapper terms={{view: "all"}}/>
        <Components.Section title="Nearby Events" titleComponent={<div>
          <a onClick={this.handleOpenNewGroupForm}>Create new group</a>
          <div><a onClick={this.handleOpenNewEventForm}>Create new event</a></div>
          {this.renderNewGroupForm()}
          {this.renderNewEventForm()}
        </div>}>
          {this.state.currentUserLocation &&
            <Components.EventsList terms={{view: 'nearby', lat: this.state.currentUserLocation.lat, lng: this.state.currentUserLocation.lng}}/>}
        </Components.Section>
      </div>
    )
  }
}

registerComponent('CommunityHome', CommunityHome, withCurrentUser, withMessages);
