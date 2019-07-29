import React from 'react';
import { Components, registerComponent, getSetting, withList} from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { useLocation } from '../../lib/routeUtil';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import withErrorBoundary from '../common/withErrorBoundary';

const styles = theme => ({
  communityMap: {
    position: "absolute",
    width: "100vw",
    height: "440px !important",
    top: 64,
    right: 0,
    [legacyBreakpoints.maxTiny]: {
      top: "43px !important"
    }
  }
});

const CommunityMapWrapper = ({classes, groupQueryTerms, results, currentUserLocation, mapOptions}) => {
  const { query } = useLocation();
  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
  return (
    <Components.CommunityMap
      terms={groupQueryTerms || {view: "all", filters: query?.filters || []}}
      loadingElement= {<div style={{ height: `100%` }} />}
      events={results}
      containerElement= {<div style={{height: "500px"}} className={classes.communityMap}/>}
      mapElement= {<div style={{ height: `100%` }} />}
      googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&v=3.exp&libraries=geometry,drawing,places`}
      center={currentUserLocation}
      {...mapOptions}
    />
  )
}
const listOptions = {
  collection: Posts,
  queryName: "communityMapEventsQuery",
  fragmentName: "PostsList",
  limit: 500,
}

registerComponent("CommunityMapWrapper", CommunityMapWrapper,
  [withList, listOptions], withErrorBoundary,
  withStyles(styles, {name: "CommunityMapWrapper"}))
