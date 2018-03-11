import { Components, registerComponent, withCurrentUser, getFragment, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Localgroups } from '../../lib/index.js';
import Dialog from 'material-ui/Dialog';
import { Link } from 'react-router';

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
    if (this.props.currentUser) {
      return (<div>
        <a onClick={this.handleOpenNewGroupForm}>Create new group</a>
        <Dialog
          contentStyle={{maxWidth:"400px"}}
          title="New Local Group Form"
          open={this.state.newGroupFormOpen}
          onRequestClose={this.handleCloseNewGroupForm}
          className="comments-item-text local-group-new-form"
          bodyClassName="local-group-new-form-body"
          autoScrollBodyContent
        >
          <Components.SmartForm
            collection={Localgroups}
            mutationFragment={getFragment('localGroupsHomeFragment')}
            prefilledProps={{organizerIds: [this.props.currentUser._id]}}
            successCallback={localGroup => {
              this.handleCloseNewGroupForm();
              this.props.flash("Successfully created new local group " + localGroup.name);
              this.props.router.push({pathname: '/groups/' + localGroup._id});
            }}
          />
        </Dialog>
      </div>)
    }
  }

  // renderNewEventForm = () => {
  //   return (
  //     <Dialog
  //       contentStyle={{maxWidth:"400px"}}
  //       title="New Local Event Form"
  //       open={this.state.newEventFormOpen}
  //       onRequestClose={this.handleCloseNewEventForm}
  //       className="comments-item-text new-local-event-form"
  //       bodyClassName="new-local-event-form-body"
  //       autoScrollBodyContent
  //     >
  //       <Components.SmartForm
  //         collection={LocalEvents}
  //         mutationFragment={getFragment('localEventsHomeFragment')}
  //         prefilledProps={{organizerIds: [this.props.currentUser._id]}}
  //         successCallback={localEvent => {
  //           this.handleCloseNewEventForm();
  //           this.props.flash("Successfully created new local event " + localEvent.name);
  //         }}
  //       />
  //     </Dialog>
  //   )
  // }

  render() {
    return (
      <div className="community-home">
        <Components.CommunityMapWrapper terms={{view: 'nearbyEvents', lat: this.state.currentUserLocation.lat, lng: this.state.currentUserLocation.lng}}/>
        <Components.Section title="Nearby Events" titleComponent={<div>
          <Components.GroupFormLink />
          {this.props.currentUser && <div><Link to={{pathname:"/newPost", query: {eventForm: true}}}> Create new event </Link></div>}
          {/* {this.renderNewEventForm()} */}
        </div>}>
          {this.state.currentUserLocation &&
            <Components.PostsList terms={{view: 'nearbyEvents', lat: this.state.currentUserLocation.lat, lng: this.state.currentUserLocation.lng}} showHeader={false} />}
        </Components.Section>
      </div>
    )
  }
}

registerComponent('CommunityHome', CommunityHome, withCurrentUser, withMessages);
