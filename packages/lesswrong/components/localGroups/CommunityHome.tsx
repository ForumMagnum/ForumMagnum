import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React, { useState, useEffect } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userGetLocation } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import { useLocation } from '../../lib/routeUtil';
import { useDialog } from '../common/withDialog'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { userIsAdmin } from '../../lib/vulcan-users'
import LibraryAddIcon from '@material-ui/icons/LibraryAdd';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  link: {
    color: theme.palette.primary.main,
    "& + &": {
      marginTop: theme.spacing.unit,
    },
  },
  welcomeText: {
    margin: 12,
  },
  enableLocationPermissions: {
    margin: 12,
  },
}))

interface ExternalProps {
}
interface CommunityHomeProps extends ExternalProps, WithMessagesProps, WithLocationProps, WithDialogProps {
}
interface CommunityHomeState {
  currentUserLocation: any,
}

const CommunityHome = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { query } = useLocation();
  const [currentUserLocation, setCurrentUserLocation] = useState(userGetLocation(currentUser, null));
  
  useEffect(() => {
    userGetLocation(currentUser, (newLocation) => {
      if (!_.isEqual(currentUserLocation, newLocation)) {
        setCurrentUserLocation(newLocation);
      }
    });
  }, [currentUserLocation, currentUser]);

  const openSetPersonalLocationForm = () => {
    openDialog({
      componentName: currentUser ? "SetPersonalMapLocationDialog" : "LoginPopup",
    });
  }

  const openEventNotificationsForm = () => {
    openDialog({
      componentName: currentUser ? "EventNotificationsDialog" : "LoginPopup",
    });
  }

  const isEAForum = forumTypeSetting.get() === 'EAForum';
  const isAdmin = userIsAdmin(currentUser);
  const canCreateEvents = currentUser;
  const canCreateGroups = currentUser && (!isEAForum || isAdmin);

  const render = () => {
    const filters = query?.filters || [];
    const { SingleColumnSection, SectionTitle, PostsList2, GroupFormLink, SectionFooter, Typography, SectionButton } = Components

    const eventsListTerms = currentUserLocation.known ? {
      view: 'nearbyEvents',
      lat: currentUserLocation.lat,
      lng: currentUserLocation.lng,
      limit: 5,
      filters: filters,
    } : {
      view: 'events',
      limit: 5,
      filters: filters,
      globalEvent: false,
    }
    const globalEventsListTerms = {
      view: 'globalEvents',
      limit: 10
    }
    const onlineGroupsListTerms: LocalgroupsViewTerms = {
      view: 'online',
      limit: 5,
      filters: filters
    }
    const groupsListTerms: LocalgroupsViewTerms = {
      view: 'nearby',
      lat: currentUserLocation.lat,
      lng: currentUserLocation.lng,
      limit: 4,
      filters: filters,
    }
    const mapEventTerms: PostsViewTerms = {
      view: 'events',
      filters: filters,
    }
    const title = forumTypeSetting.get() === 'EAForum' ? 'Community and Events' : 'Welcome to the Community Section';
    const WelcomeText = () => (isEAForum ?
    <Typography variant="body2" className={classes.welcomeText}>
      <p>
        On the map above you can find upcoming events (blue pin icons) and local groups (green star icons),
        and other users who have added themselves to the map (purple person icons).
      </p>
      <p>
        This page is being trialed with a handful of EA groups, so the map isn't yet fully populated. For more, visit
        the <a className={classes.link} href="https://eahub.org/groups?utm_source=forum.effectivealtruism.org&utm_medium=Organic&utm_campaign=Forum_Homepage">EA Hub Groups Directory</a>.
      </p>
    </Typography> : 
    <Typography variant="body2" className={classes.welcomeText}>
      On the map above you can find nearby events (blue arrows), local groups (green house icons),
      and other users who have added themselves to the map (purple person icons)
    </Typography>);

    return (
      <React.Fragment>
        <AnalyticsContext pageContext="communityHome">
          <Components.CommunityMapWrapper
            terms={mapEventTerms}
            mapOptions={currentUserLocation.known && {center: currentUserLocation, zoom: 5}}
          />
            <SingleColumnSection>
              <SectionTitle title={title} />
              <WelcomeText />
              <SectionFooter>
                <a onClick={openSetPersonalLocationForm}>
                  {currentUser?.mapLocation ? "Edit my location on the map" : "Add me to the map"}
                </a>
                <a onClick={openEventNotificationsForm}>
                  {currentUser?.nearbyEventsNotifications ? `Edit my event/groups notification settings` : `Sign up for event/group notifications`}
                </a>
              </SectionFooter>
            </SingleColumnSection>
            <SingleColumnSection>
              <SectionTitle title="Global Events">
                {canCreateEvents && <Link to="/newPost?eventForm=true"><SectionButton>
                  <LibraryAddIcon /> Create New Event
                </SectionButton></Link>}
              </SectionTitle>
              <AnalyticsContext listContext={"communityEvents"}>
                <PostsList2 terms={globalEventsListTerms}/>
              </AnalyticsContext>
            </SingleColumnSection>
            <SingleColumnSection>
              <SectionTitle title="Nearby Events">
                {canCreateEvents && <Link to="/newPost?eventForm=true"><SectionButton>
                  <LibraryAddIcon /> Create New Event
                </SectionButton></Link>}
              </SectionTitle>
              <AnalyticsContext listContext={"communityEvents"}>
                {!currentUserLocation.known && !currentUserLocation.loading && 
                  <Typography variant="body2" className={classes.enableLocationPermissions}>
                    Enable location permissions to see events near you.
                  </Typography>
                }
                {!currentUserLocation.loading && <PostsList2 terms={eventsListTerms}>
                  <Link to="/pastEvents">View Past Events</Link>
                  <Link to="/upcomingEvents">View Upcoming Events</Link>
                </PostsList2>}
              </AnalyticsContext>
            </SingleColumnSection>
            
            <SingleColumnSection>
              <SectionTitle title="Online Groups">
                {canCreateGroups && <GroupFormLink isOnline={true} />}
              </SectionTitle>
              <AnalyticsContext listContext={"communityGroups"}>
                <Components.LocalGroupsList terms={onlineGroupsListTerms}/>
              </AnalyticsContext>
            </SingleColumnSection>
            <SingleColumnSection>
              <SectionTitle title="Local Groups">
                {canCreateGroups && <GroupFormLink />}
              </SectionTitle>
              { currentUserLocation.loading
                ? <Components.Loading />
                : <Components.LocalGroupsList terms={groupsListTerms}>
                      <Link to={"/allGroups"}>View All Groups</Link>
                  </Components.LocalGroupsList>
              }
            </SingleColumnSection>
            {!isEAForum && <SingleColumnSection>
              <SectionTitle title="Resources"/>
              <AnalyticsContext listContext={"communityResources"}>
                <PostsList2 terms={{view: 'communityResourcePosts'}} showLoadMore={false} />
              </AnalyticsContext>
            </SingleColumnSection>}
        </AnalyticsContext>
      </React.Fragment>
    )
  }
  return render();
}

const CommunityHomeComponent = registerComponent('CommunityHome', CommunityHome, {styles});

declare global {
  interface ComponentTypes {
    CommunityHome: typeof CommunityHomeComponent
  }
}
