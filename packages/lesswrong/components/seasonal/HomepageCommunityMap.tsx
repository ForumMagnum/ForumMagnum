import React from 'react';
import { useUserLocation } from '../../lib/collections/users/helpers';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import {useLocation} from "../../lib/routeUtil";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  }
});

export const HomepageCommunityMap = ({classes}: {
  classes: ClassesType,
}) => {
  const { CommunityMapWrapper } = Components

  const { location } = useLocation()
  const currentRoute = location.currentRoute
  
  const currentUser = useCurrentUser()
  const currentUserLocation = useUserLocation(currentUser)
  const mapEventTerms: PostsViewTerms = {
    view: 'events',
    filters: [],
  }

  if ((forumTypeSetting.get() !== "LessWrong") || (currentRoute?.name !=='home')) return null

  return <div className={classes.root}>
    <CommunityMapWrapper
      terms={mapEventTerms}
      mapOptions={currentUserLocation.known && {center: currentUserLocation, zoom: 5}}
      showUsers
    />
  </div>;
}

const HomepageCommunityMapComponent = registerComponent('HomepageCommunityMap', HomepageCommunityMap, {styles});

declare global {
  interface ComponentTypes {
    HomepageCommunityMap: typeof HomepageCommunityMapComponent
  }
}

