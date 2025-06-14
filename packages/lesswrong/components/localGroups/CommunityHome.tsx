import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useUserLocation } from '../hooks/useUserLocation';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { useDialog } from '../common/withDialog'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';
import { userIsAdmin } from '../../lib/vulcan-users/permissions'
import LibraryAddIcon from '@/lib/vendor/@material-ui/icons/src/LibraryAdd';
import { pickBestReverseGeocodingResult } from '../../lib/geocoding';
import { useGoogleMaps } from '../form-components/LocationFormComponent';
import { WithMessagesFunctions } from '../common/FlashMessages';
import SetPersonalMapLocationDialog from "./SetPersonalMapLocationDialog";
import LoginPopup from "../users/LoginPopup";
import EventNotificationsDialog from "./EventNotificationsDialog";
import CommunityMapWrapper from "./CommunityMapWrapper";
import LocalGroupsList from "./LocalGroupsList";
import Loading from "../vulcan-core/Loading";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import PostsList2 from "../posts/PostsList2";
import GroupFormLink from "./GroupFormLink";
import SectionFooter from "../common/SectionFooter";
import { Typography } from "../common/Typography";
import SectionButton from "../common/SectionButton";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const UsersProfileUpdateMutation = gql(`
  mutation updateUserCommunityHome($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersProfile
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
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
});

interface ExternalProps {
}
interface CommunityHomeProps extends ExternalProps, WithMessagesFunctions, WithLocationProps, WithDialogProps {
}
interface CommunityHomeState {
  currentUserLocation: any,
}

const CommunityHome = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { query } = useLocation();
  
  const [updateUser] = useMutation(UsersProfileUpdateMutation);
  
  const isEAForum = forumTypeSetting.get() === 'EAForum';
  
  // this gets the location from the current user settings or from the user's browser
  const currentUserLocation = useUserLocation(currentUser)
  
  // if the current user provides their browser location and they do not yet have a location in their user settings,
  // assign their browser location to their user settings location
  const [mapsLoaded, googleMaps] = useGoogleMaps()
  const [geocodeError, setGeocodeError] = useState(false)
  const updateUserLocation = useCallback(async ({lat, lng, known}: {
    lat: number, lng: number, known: boolean
  }) => {
    if (isEAForum && mapsLoaded && !geocodeError && currentUser && !currentUser.location && known) {
      try {
        // get a list of matching Google locations for the current lat/lng
        const geocoder = new googleMaps.Geocoder();
        const geocodingResponse = await geocoder.geocode({
          location: {lat, lng}
        });
        const results = geocodingResponse?.results;
        
        if (results?.length) {
          const location = pickBestReverseGeocodingResult(results)
          void updateUser({
            variables: {
              selector: { _id: currentUser._id },
              data: {
                location: location?.formatted_address,
                googleLocation: location
              }
            }
          })
        }
      } catch (e) {
        setGeocodeError(true)
        // eslint-disable-next-line no-console
        console.error(e?.message)
      }
    }
  }, [isEAForum, mapsLoaded, googleMaps, geocodeError, currentUser, updateUser])

  useEffect(() => {
    // if we've gotten a location from the browser, save it
    if (isEAForum && currentUser && !currentUser.location && !currentUserLocation.loading && currentUserLocation.known) {
      void updateUserLocation(currentUserLocation)
    }
  }, [isEAForum, currentUser, currentUserLocation, updateUserLocation])

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
  const canCreateGroups = currentUser && (!isEAForum || isAdmin);

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

    const title = forumTypeSetting.get() === 'EAForum' ? 'Community' : 'Welcome to the Community Section';
    const WelcomeText = () => (isEAForum ?
    <Typography variant="body2" className={classes.welcomeText}>
      <p>
        On the map above you can find upcoming events (blue pin icons) and local groups (green star icons),
        and other users who have added themselves to the map (purple person icons).
      </p>
      <p>
        Not all groups have been added to this page yet. For more, visit
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

export default registerComponent('CommunityHome', CommunityHome, {styles});


