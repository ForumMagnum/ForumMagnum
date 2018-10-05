import {
  Components,
  registerComponent,
  getFragment,
  withMessages,
  withEdit
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Localgroups } from '../../lib/index.js';
import Dialog from 'material-ui/Dialog';
import { withRouter } from 'react-router';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router';
import withUser from '../common/withUser';

const placeholderLat = 37.871853;
const placeholderLng = -122.258423;

class CommunityHome extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      newGroupFormOpen: false,
      newEventFormOpen: false,
      currentUserLocation: this.getUserLocation(),
    }
  }

  componentDidMount() {
    const newLocation = this.getUserLocation();
    if (!_.isEqual(this.state.currentUserLocation, newLocation)) {
      this.setState({ currentUserLocation: this.getUserLocation() });
    }
  }
  
  // Return the current user's location, as a latitude-longitude pair, plus
  // boolean fields `loading` and `known`. If `known` is false, the lat/lng are
  // invalid placeholders. If `loading` is true, then `known` is false, but the
  // state might be updated with a location later.
  //
  // If the user is logged in, the location specified in their account settings
  // is used first. If the user is not logged in, then no location is available
  // for server-side rendering, but we can try to get a location client-side
  // using the browser geolocation API. (This won't necessarily work, since not
  // all browsers and devices support it, and it requires user permission.)
  getUserLocation() {
    const currentUser = this.props.currentUser;
    const currentUserLat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
    const currentUserLng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]
    if (currentUserLat && currentUserLng) {
      // First return a location from the user profile, if set
      return {lat: currentUserLat, lng: currentUserLng, loading: false, known: true}
    } else if (Meteor.isServer) {
      // If there's no location in the user profile, we may still be able to get
      // a location from the browser--but not in SSR.
      return {lat: placeholderLat, lng:placeholderLng, loading: true, known: false};
    } else {
      // If we're on the browser, try to get a location using the browser
      // geolocation API. This is not always available.
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined'
          && navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          if(position && position.coords) {
            const navigatorLat = position.coords.latitude
            const navigatorLng = position.coords.longitude
            return {lat: navigatorLat, lng: navigatorLng, loading: false, known: true}
          }
        });
      }
      
      return {lat: placeholderLat, lng:placeholderLng, loading: false, known: false};
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
          {this.props.currentUser && <Components.GroupFormLink />}
          {this.props.currentUser && <Components.SectionSubtitle>
            <Link to={{pathname:"/newPost", query: {eventForm: true}}}>
              Create new event
            </Link>
          </Components.SectionSubtitle>}
          <Components.SectionSubtitle>
            <Link to="/pastEvents">See past events</Link>
          </Components.SectionSubtitle>
        </div>}>
          {this.state.currentUserLocation &&
            <div>
              { this.state.currentUserLocation.loading
                ? <Components.Loading />
                : <Components.LocalGroupsList
                    terms={groupsListTerms}
                    showHeader={false} />}
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

registerComponent('CommunityHome', CommunityHome, withUser, withMessages, withRouter, [withEdit, withEditOptions]);
