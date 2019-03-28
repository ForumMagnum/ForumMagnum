import {
  Components,
  registerComponent,
  withMessages,
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withRouter } from 'react-router';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  listDivider: {
    marginTop: 12,
    marginRight: 37,
    marginLeft: 32,
    border: 0,
    borderTop: "1px solid #eee",
  },
});

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
    const {classes, router} = this.props;
    const filters = (router.location.query && router.location.query.filters) || [];
    const { TabNavigationMenu } = Components
    
    const postsListTerms = {
      view: 'nearbyEvents',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      limit: 5,
      filters: filters,
    }
    const groupsListTerms = {
      view: 'nearby',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      limit: 3,
      filters: filters,
    }
    const mapEventTerms = {
      view: 'nearbyEvents',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      filters: filters,
    }
    return (
      <div className="community-home">
        <TabNavigationMenu />
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
        <div>
          { this.state.currentUserLocation.loading
            ? <Components.Loading />
            : <Components.LocalGroupsList
                terms={groupsListTerms}
                showHeader={false} />
          }
          <hr className={classes.listDivider}/>
          <Components.PostsList terms={postsListTerms} />
        </div>
        </Components.Section>
        <Components.Section title="Resources">
          <Components.PostsList terms={{view: 'communityResourcePosts'}} showLoadMore={false} />
        </Components.Section>
      </div>
    )
  }
}

registerComponent('CommunityHome', CommunityHome,
  withUser, withMessages, withRouter,
  withStyles(styles, { name: "CommunityHome" }));
