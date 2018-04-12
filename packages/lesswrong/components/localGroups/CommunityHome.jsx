import {
  Components,
  registerComponent,
  withCurrentUser,
  getFragment,
  withMessages,
  withEdit
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Localgroups } from '../../lib/index.js';
import Dialog from 'material-ui/Dialog';
import { Link, withRouter } from 'react-router';
import Users from 'meteor/vulcan:users';

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
    const currentUser = this.props.currentUser;
    const currentUserLat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
    const currentUserLng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]
    if (currentUserLat && currentUserLng) {
      this.setState({
        currentUserLocation: {lat: currentUserLat, lng: currentUserLng}
      })
    } else {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          const navigatorLat = position.coords.latitude
          const navigatorLng = position.coords.longitude
          this.setState({
            currentUserLocation: {lat: navigatorLat, lng: navigatorLng}
          })
        });
      }
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

  render() {
    const router = this.props.router;
    const postsListTerms = {
      view: 'nearbyEvents',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      limit: 5,
      filters: router.location.query && router.location.query.filters || [],
    }
    const groupsListTerms = {
      view: 'nearby',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      limit: 3,
      filters: router.location.query && router.location.query.filters || [],
    }
    const mapEventTerms = {
      view: 'nearbyEvents',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      filters: router.location.query && router.location.query.filters || [],
    }
    return (
      <div className="community-home">
        <Components.CommunityMapWrapper
          terms={mapEventTerms}
        />
        <Components.Section title="Local Groups" titleComponent={<div>
          {this.props.currentUser && <div className="local-groups-menu"><Components.GroupFormLink /></div>}
          {this.props.currentUser && <div><Link className="local-groups-menu" to={{pathname:"/newPost", query: {eventForm: true}}}> Create new event </Link></div>}
        </div>}>
          {this.state.currentUserLocation &&
            <div>
              <Components.LocalGroupsList
                terms={groupsListTerms}
                showHeader={false} />
              <hr className="community-home-list-divider"/>
              <Components.PostsList
                terms={postsListTerms}
                showHeader={false} />
            </div>}
        </Components.Section>
        <Components.Section title="Resources">
          <Components.PostsList terms={{view: 'communityResourcePosts'}} showHeader={false} />
        </Components.Section>
      </div>
    )
  }
}


const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersProfile',
};

registerComponent('CommunityHome', CommunityHome, withCurrentUser, withMessages, withRouter, [withEdit, withEditOptions]);
