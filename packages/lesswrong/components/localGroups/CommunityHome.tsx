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

const styles = createStyles((theme: ThemeType): JssStyles => ({
  link: {
    display: "block",
    color: theme.palette.primary.main,
    "& + &": {
      marginTop: theme.spacing.unit,
    },
  },
  welcomeText: {
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
  const [currentUserLocation, setCurrentUserLocation] = useState(userGetLocation(currentUser));
  
  useEffect(() => {
    const newLocation = userGetLocation(currentUser);
    if (!_.isEqual(currentUserLocation, newLocation)) {
      setCurrentUserLocation(userGetLocation(currentUser));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

  const render = () => {
    const filters = query?.filters || [];
    const { SingleColumnSection, SectionTitle, PostsList2, GroupFormLink, SectionFooter, Typography } = Components

    const eventsListTerms = {
      view: 'nearbyEvents',
      lat: currentUserLocation.lat,
      lng: currentUserLocation.lng,
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
      lat: currentUserLocation.lat,
      lng: currentUserLocation.lng,
      limit: 4,
      filters: filters,
    }
    const mapEventTerms: PostsViewTerms = {
      view: 'nearbyEvents',
      lat: currentUserLocation.lat,
      lng: currentUserLocation.lng,
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
                On the map above you can find nearby events (blue arrows)
                {isEAForum ? ' and ' : ', '}
                local groups (green house icons)
                {!isEAForum && 'and other users who have added themselves to the map (purple person icons)'}
              </Typography>
                <SectionFooter>
                  {!isEAForum &&
                  <a onClick={openSetPersonalLocationForm}>
                    {currentUser?.mapLocation ? "Edit my location on the map" : "Add me to the map"}
                  </a>}
                  <a onClick={openEventNotificationsForm}>
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
                {currentUser && (!isEAForum || isAdmin) && <GroupFormLink />}
              </SectionTitle>
              { currentUserLocation.loading
                ? <Components.Loading />
                : <Components.LocalGroupsList terms={groupsListTerms}>
                      <Link to={"/allGroups"}>View All Groups</Link>
                  </Components.LocalGroupsList>
              }
            </SingleColumnSection>
            <SingleColumnSection>
              <SectionTitle title="Resources"/>
              <AnalyticsContext listContext={"communityResources"}>
                {isEAForum ?
                  <Typography variant="body1">
                      <a className={classes.link} href="https://eahub.org/groups?utm_source=forum.effectivealtruism.org&utm_medium=Organic&utm_campaign=Forum_Homepage">EA Hub Groups Directory</a>
                  </Typography> :
                  <PostsList2 terms={{view: 'communityResourcePosts'}} showLoadMore={false} />
                }
              </AnalyticsContext>
            </SingleColumnSection>
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
