import { Components, registerComponent, } from '../../lib/vulcan-lib';
import { withMessages } from '../common/withMessages';
import React, { Component } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userGetLocation } from '../../lib/collections/users/helpers';
import withUser from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import { withLocation } from '../../lib/routeUtil';
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
    const { SingleColumnSection, SectionTitle, PostsList2, GroupFormLink, SectionFooter, Typography } = Components

    const eventsListTerms = {
      view: 'nearbyEvents',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      limit: 5,
      filters: filters,
      onlineEvent: false
    }
    const onlineEventsListTerms = {
      view: 'onlineEvents',
      limit: 10
    }
    const groupsListTerms: LocalgroupsViewTerms = {
      view: 'nearby',
      lat: this.state.currentUserLocation.lat,
      lng: this.state.currentUserLocation.lng,
      limit: 4,
      filters: filters,
    }
    const mapEventTerms: PostsViewTerms = {
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
              <SectionTitle title="Online Events"/>
              <AnalyticsContext listContext={"communityEvents"}>
                <PostsList2 terms={onlineEventsListTerms}/>
              </AnalyticsContext>
            </SingleColumnSection>
            <SingleColumnSection>
              <SectionTitle title="In-Person Events"/>
              <AnalyticsContext listContext={"communityEvents"}>
                <PostsList2 terms={eventsListTerms}>
                  <Link to="/pastEvents">View Past Events</Link>
                  <Link to="/upcomingEvents">View Upcoming Events</Link>
                </PostsList2>
              </AnalyticsContext>
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
