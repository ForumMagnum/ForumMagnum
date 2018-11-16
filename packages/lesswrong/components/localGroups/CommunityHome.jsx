import {
  Components,
  registerComponent,
  withMessages,
  withEdit
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withRouter } from 'react-router';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router';
import withUser from '../common/withUser';

class CommunityHome extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      newGroupFormOpen: false,
      newEventFormOpen: false,
      currentUserLocation: Users.getLocation(props.currentUser),
    }
  }

  componentDidMount() {
    const { currentUser } = this.props
    const newLocation = Users.getLocation(currentUser);
    if (!_.isEqual(this.state.currentUserLocation, newLocation)) {
      this.setState({ currentUserLocation: Users.getLocation(currentUser) });
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
          <Components.SectionSubtitle>
            <Link to="/upcomingEvents">See upcoming events</Link>
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
          <Components.PostsList terms={{view: 'communityResourcePosts'}} showHeader={false} showLoadMore={false} />
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
