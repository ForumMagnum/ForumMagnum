import { Components, registerComponent, } from '../../lib/vulcan-lib';
import { withMessages } from '../common/withMessages';
import React, { Component } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userGetLocation } from '../../lib/collections/users/helpers';
import withUser from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import EventIcon from '@material-ui/icons/Event';
import { withLocation } from '../../lib/routeUtil';
import Typography from '@material-ui/core/Typography';
import withDialog from '../common/withDialog'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import * as _ from 'underscore';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  welcomeText: {
    margin: 12
  }
}))

interface ExternalProps {
}
interface CommunityHomeProps extends ExternalProps, WithUserProps, WithMessagesProps, WithLocationProps, WithDialogProps, WithStylesProps {
}
interface CommunityHomeState {
  currentUserLocation: any,
}

class CommunityHome extends Component<CommunityHomeProps,CommunityHomeState> {
  constructor(props: CommunityHomeProps) {
    super(props);
    this.state = {
      currentUserLocation: userGetLocation(props.currentUser)
    }
  }

  componentDidMount() {
    const { currentUser } = this.props
    const newLocation = userGetLocation(currentUser);
    if (!_.isEqual(this.state.currentUserLocation, newLocation)) {
      this.setState({ currentUserLocation: userGetLocation(currentUser) });
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
        <AnalyticsContext pageContext="communityHome">
          <Components.CommunityMapWrapper
            terms={mapEventTerms}
          />
            <SingleColumnSection>
              <SectionTitle title="Welcome to the Community Section"/>
              <Typography variant="body2" className={classes.welcomeText}>
                On the map above you can find nearby events (blue arrows), local groups (green house icons) and other users who have added themselves to the map (purple person icons)
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
                : <Components.LocalGroupsList terms={groupsListTerms}>
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
              <AnalyticsContext listContext={"communityEvents"}>
                <PostsList2 terms={postsListTerms}>
                  <Link to="/pastEvents">View Past Events</Link>
                  <Link to="/upcomingEvents">View Upcoming Events</Link>
                </PostsList2>
              </AnalyticsContext>
            </SingleColumnSection>
            <SingleColumnSection>
              <SectionTitle title="Resources"/>
              <AnalyticsContext listContext={"communityResources"}>
                <PostsList2 terms={{view: 'communityResourcePosts'}} showLoadMore={false} />
              </AnalyticsContext>
            </SingleColumnSection>
        </AnalyticsContext>
      </React.Fragment>
    )
  }
}

const CommunityHomeComponent = registerComponent<ExternalProps>(
  'CommunityHome', CommunityHome, {
    styles,
    hocs: [withUser, withMessages, withLocation, withDialog]
  }
);

declare global {
  interface ComponentTypes {
    CommunityHome: typeof CommunityHomeComponent
  }
}
