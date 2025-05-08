import React, { useState, useEffect } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import BadlyTypedReactMapGL, { Marker as BadlyTypedMarker } from 'react-map-gl';
import { mapboxAPIKeySetting } from '../../../lib/publicSettings';
import { connectHits } from 'react-instantsearch-dom';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/PersonPin';
import type { Hit } from 'react-instantsearch-core';
import classNames from 'classnames';
import { componentWithChildren, Helmet } from '../../../lib/utils/componentsWithChildren';
import { useMapStyle } from '@/components/hooks/useMapStyle';
import { isFriendlyUI } from '@/themes/forumTheme';
import { CloudinaryImage2 } from "../../common/CloudinaryImage2";
import { StyledMapPopup } from "../../localGroups/StyledMapPopup";

const ReactMapGL = componentWithChildren(BadlyTypedReactMapGL);
const Marker = componentWithChildren(BadlyTypedMarker);

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
  },
  icon: {
    height: 20,
    width: 20,
    fill: theme.palette.individual,
    opacity: 0.8,
    cursor: 'pointer'
  },
  popupTitle: {
    display: 'flex',
    columnGap: 10,
    alignItems: 'center',
    color: isFriendlyUI ? undefined : theme.palette.text.alwaysBlack,
  },
  profileImage: {
    'box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    '-webkit-box-shadow': '0px 0px 2px 0px ' + theme.palette.boxShadowColor(.25),
    '-moz-box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    borderRadius: '50%',
  },
  popupAddress: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    fontSize: 12,
    fontWeight: 'normal',
    marginTop: 2
  },
  popupBio: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[800],
    fontSize: 14,
    lineHeight: '20px',
    display: '-webkit-box',
    "-webkit-line-clamp": 3,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
  }
});

const defaultCenter = {lat: 18.586392, lng: -11.334020}

interface LatLng {
  lat: number;
  lng: number;
}

const SearchResultsMapInner = ({
  center = defaultCenter,
  zoom = 2,
  from = "community_members_tab",
  hits,
  className,
  classes,
}: {
  center?: LatLng,
  zoom?: number,
  from?: string,
  hits: Array<Hit<SearchUser>>,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [activeResultId, setActiveResultId] = useState('')
  
  const [viewport, setViewport] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: zoom
  })
  
  // when getting the location from the browser, we want to re-center the map
  useEffect(() => {
    setViewport({
      latitude: center.lat,
      longitude: center.lng,
      zoom: zoom
    })
  }, [center.lat, center.lng, zoom])
  
  // to make sure that map markers with exactly the same lat/lng don't appear exactly on top of each other,
  // we slightly shift all markers by a random distance
  const [markerLocations, setMarkerLocations] = useState<Record<string, LatLng>>({})
  useEffect(() => {
    const locations = {...markerLocations}
    hits.forEach(hit => {
      if (!hit._geoloc || locations[hit._id]) return
      
      // within about a quarter mile radius
      const lng = ((Math.random() - 0.5) * 0.01) + hit._geoloc.coordinates[0];
      const lat = ((Math.random() - 0.5) * 0.01) + hit._geoloc.coordinates[1];

      locations[hit._id] = {lat, lng}
    })
    setMarkerLocations(locations)
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits])

  const mapStyle = useMapStyle();
  return <div className={classNames(classes.root, className)}>
    <Helmet>
      <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css' rel='stylesheet' />
    </Helmet>
    <ReactMapGL
      {...viewport}
      width="100%"
      height="100%"
      mapStyle={mapStyle}
      onViewportChange={viewport => setViewport(viewport)}
      mapboxApiAccessToken={mapboxAPIKeySetting.get() || undefined}
    >
      {hits.map(hit => {
        if (!hit._geoloc || !markerLocations[hit._id]) return null
        
        return <React.Fragment key={hit._id}>
          <Marker
            latitude={markerLocations[hit._id].lat}
            longitude={markerLocations[hit._id].lng}
            offsetLeft={-8}
            offsetTop={-20}
          >
            <PersonIcon className={classes.icon} onClick={() => setActiveResultId(hit._id)} />
          </Marker>
          {(activeResultId === hit._id) && <StyledMapPopup
            lat={markerLocations[hit._id].lat}
            lng={markerLocations[hit._id].lng}
            link={`/users/${hit.slug}?from=${from}`}
            title={<div className={classes.popupTitle}>
              {hit.profileImageId && <CloudinaryImage2
                height={50}
                width={50}
                imgProps={{q: '100'}}
                publicId={hit.profileImageId}
                className={classes.profileImage}
              />}
              <div>
                <div>{hit.displayName}</div>
                <div className={classes.popupAddress}>{hit.mapLocationAddress}</div>
              </div>
            </div>}
            onClose={() => setActiveResultId('')}
            hideBottomLinks
          >
            {hit.bio && <div className={classes.popupBio}>{hit.bio}</div>}
          </StyledMapPopup>}
        </React.Fragment>
      })}
    </ReactMapGL>
  </div>
}

// connectHits is probably nothing but a consumer acting as a HoC, like this:
// const connectHits = (C) => { const hits = useHits(); return (args) => C({...args, hits}); }
// It consumes the data provided by InstantSearch, which should be a parent of us
type SearchResultsMapProps = {
  center?: {lat: number, lng: number},
  zoom?: number,
  hits?: Array<Hit<SearchUser>>,
  className?: string
}
const ConnectedSearchResultsMapInner: React.ComponentClass<SearchResultsMapProps, any> = connectHits(SearchResultsMapInner)
export const SearchResultsMap = registerComponent("SearchResultsMap", ConnectedSearchResultsMapInner, { styles });
export const RawSearchResultsMap = registerComponent("RawSearchResultsMap", SearchResultsMapInner, { styles });

declare global {
  interface ComponentTypes {
    SearchResultsMap: typeof SearchResultsMap
    RawSearchResultsMap: typeof RawSearchResultsMap
  }
}
