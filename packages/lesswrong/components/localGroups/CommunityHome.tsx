"use client";

import LibraryAddIcon from '@/lib/vendor/@material-ui/icons/src/LibraryAdd';
import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import SectionButton from "../common/SectionButton";
import SectionFooter from "../common/SectionFooter";
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import { Typography } from "../common/Typography";
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useUserLocation } from '../hooks/useUserLocation';
import PostsList2 from "../posts/PostsList2";
import LoginPopup from "../users/LoginPopup";
import Loading from "../vulcan-core/Loading";
import CommunityMapWrapper from "./CommunityMapWrapper";
import EventNotificationsDialog from "./EventNotificationsDialog";
import GroupFormLink from "./GroupFormLink";
import LocalGroupsList from "./LocalGroupsList";
import SetPersonalMapLocationDialog from "./SetPersonalMapLocationDialog";

const styles = defineStyles("CommunityHome", (theme: ThemeType) => ({
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
}));

const CommunityHome = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { query } = useLocation();

  // This gets the location from the current user settings or from the user's browser.
  const currentUserLocation = useUserLocation(currentUser)

  const openSetPersonalLocationForm = () => {
    if (currentUser) {
      openDialog({
        name: "SetPersonalMapLocationDialog",
        contents: ({onClose}) => <SetPersonalMapLocationDialog onClose={onClose} />
      });
    } else {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
      });
    }
  }

  const openEventNotificationsForm = () => {
    if (currentUser) {
      openDialog({
        name: "EventNotificationsDialog",
        contents: ({onClose}) => <EventNotificationsDialog onClose={onClose} />
      });
    } else {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
      });
    }
  }

  const isAdmin = userIsAdmin(currentUser);
  const canCreateEvents = currentUser;
  const canCreateGroups = currentUser;

  const render = () => {
    const filters: string[] = query.filters
      ? Array.isArray(query.filters)
        ? query.filters
        : [query.filters]
      : [];

    const eventsListTerms = currentUserLocation.known ? {
      view: 'nearbyEvents',
      lat: currentUserLocation.lat,
      lng: currentUserLocation.lng,
      limit: 5,
      filters: filters,
    } as const : {
      view: 'events',
      limit: 5,
      filters: filters,
      globalEvent: false,
    } as const;

    const globalEventsListTerms = {
      view: 'globalEvents',
      limit: 10
    } as const;

    const mapEventTerms: PostsViewTerms = {
      view: 'events',
      filters: filters,
    };

    const title = 'Welcome to the Community Section';
    const WelcomeText = () => (<Typography variant="body2" className={classes.welcomeText}>
          On the map above you can find nearby events (blue arrows), local groups (green house icons),
          and other users who have added themselves to the map (purple person icons)
        </Typography>);

    return (
      <React.Fragment>
        <AnalyticsContext pageContext="communityHome">
          <CommunityMapWrapper
            terms={mapEventTerms}
            mapOptions={currentUserLocation.known && {center: currentUserLocation, zoom: 5}}
            showUsersByDefault
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
                <LocalGroupsList view='online' terms={{ filters }} limit={5} />
              </AnalyticsContext>
            </SingleColumnSection>
            <SingleColumnSection>
              <SectionTitle title="Local Groups">
                {canCreateGroups && <GroupFormLink />}
              </SectionTitle>
              { currentUserLocation.loading
                ? <Loading />
                : <LocalGroupsList view='nearby'
                    terms={{
                      lat: currentUserLocation.lat,
                      lng: currentUserLocation.lng,
                      filters,
                    }}
                    limit={4}
                  >
                    <Link to={"/allGroups"}>View All Groups</Link>
                  </LocalGroupsList>
              }
            </SingleColumnSection>
            {<SingleColumnSection>
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

export default CommunityHome;
