import React from 'react';
import { useUserLocation } from '../../lib/collections/users/helpers';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 50,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  }
});

export const HomepageCommunityMap = ({classes}: {
  classes: ClassesType,
}) => {
  const { CommunityMapWrapper } = Components
  
  const currentUser = useCurrentUser()
  const currentUserLocation = useUserLocation(currentUser)
  const mapEventTerms: PostsViewTerms = {
    view: 'events',
    filters: [],
  }

  return <div className={classes.root}>
    <CommunityMapWrapper
      terms={mapEventTerms}
      mapOptions={currentUserLocation.known && {center: currentUserLocation, zoom: 5}}
    />
  </div>;
}

const HomepageCommunityMapComponent = registerComponent('HomepageCommunityMap', HomepageCommunityMap, {styles});

declare global {
  interface ComponentTypes {
    HomepageCommunityMap: typeof HomepageCommunityMapComponent
  }
}

