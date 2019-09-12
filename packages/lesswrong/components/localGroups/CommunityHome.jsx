import {
  Components,
  registerComponent,
  withMessages,
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Link } from '../../lib/reactRouterWrapper.js';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import EventIcon from '@material-ui/icons/Event';
import { withLocation } from '../../lib/routeUtil';
import Typography from '@material-ui/core/Typography';
import withDialog from '../common/withDialog'

const styles = theme => ({
  welcomeText: {
    margin: 12
  }
})

class CommunityHome extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      currentUserLocation: Users.getLocation(props.currentUser)
    }
  }

  componentDidMount() {
    const { currentUser } = this.props
    const newLocation = Users.getLocation(currentUser);
    if (!_.isEqual(this.state.currentUserLocation, newLocation)) {
      this.setState({ currentUserLocation: Users.getLocation(currentUser) });
    }
  }

  openSetPersonalLocationForm = () => {
    const { openDialog, currentUser } = this.props
    openDialog({
      componentName: currentUser ? "SetPersonalMapLocationDialog" : "LoginPopup",
    });
  }

  openEventNotificationsForm = () => {
    const { openDialog, currentUser } = this.props
    openDialog({
      componentName: currentUser ? "EventNotificationsDialog" : "LoginPopup",
    });
  }

  render() {
    const { classes, currentUser } = this.props;
    const { query } = this.props.location; // From withLocation
    const filters = query?.filters || [];
    const { SingleColumnSection, SectionTitle, PostsList2, SectionButton, GroupFormLink, SectionFooter } = Components

    const postsListTerms = {
      view: 'nearbyEvents',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      limit: 7,
      filters: filters,
    }
    const groupsListTerms = {
      view: 'nearby',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      limit: 7,
      filters: filters,
    }
    const mapEventTerms = {
      view: 'nearbyEvents',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      filters: filters,
    }
    return (
      <React.Fragment>
        <Components.CommunityMapWrapper
          terms={mapEventTerms}
        />
          <SingleColumnSection>
            <SectionTitle title="Welcome to the Community Section"/>
            <Typography variant="body2" className={classes.welcomeText}>
              On the map above you can find nearby events (blue arrows), local groups (green house icons) and other users who have added themselves to the map (colored clusters and green person icons)
            </Typography>
              <SectionFooter>
                <a onClick={this.openSetPersonalLocationForm}>
                  {currentUser?.mapLocation ? "Edit my location on the map" : "Add me to the map"}
                </a>
                <a onClick={this.openEventNotificationsForm}>
                  {currentUser?.nearbyEventsNotifications ? `Edit my event/groups notification settings` : `Sign up for event/group notifications`} [Beta]
                </a>
              </SectionFooter>
          </SingleColumnSection>
          <SingleColumnSection>
            <SectionTitle title="Local Groups">
              {this.props.currentUser && <GroupFormLink />}
            </SectionTitle>
            { this.state.currentUserLocation.loading
              ? <Components.Loading />
              : <Components.LocalGroupsList
                  terms={groupsListTerms}
                  showHeader={false} >
                    <Link to={"/allGroups"}>View All Groups</Link>
                </Components.LocalGroupsList>
            }
          </SingleColumnSection>
          <SingleColumnSection>
            <SectionTitle title="Events">
              {this.props.currentUser && <Link to={{pathname:"/newPost", search: `?eventForm=true`}}>
                <SectionButton>
                  <EventIcon />
                  New Event
                </SectionButton>
              </Link>}
            </SectionTitle>
            <PostsList2 terms={postsListTerms}>
              <Link to="/pastEvents">View Past Events</Link>
              <Link to="/upcomingEvents">View Upcoming Events</Link>
            </PostsList2>
          </SingleColumnSection>
          <SingleColumnSection>
            <SectionTitle title="Resources"/>
            <PostsList2 terms={{view: 'communityResourcePosts'}} showLoadMore={false} />
          </SingleColumnSection>
      </React.Fragment>
    )
  }
}

registerComponent('CommunityHome', CommunityHome,
  withUser, withMessages, withLocation, withStyles(styles, {name: "CommunityMapWrapper"}), withDialog);
