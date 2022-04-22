import React, { useState, useEffect } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { createStyles } from '@material-ui/core/styles';
import ReactMapGL, { Marker } from 'react-map-gl';
import { Helmet } from 'react-helmet'
import { forumTypeSetting } from '../../../lib/instanceSettings';
import { mapboxAPIKeySetting } from '../../../lib/publicSettings';
import { connectHits } from 'react-instantsearch-dom';
import PersonIcon from '@material-ui/icons/PersonPin';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { Hit } from 'react-instantsearch-core';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {
    width: "100%",
    height: 440,
  },
  icon: {
    height: 20,
    width: 20,
    fill: theme.palette.individual,
    opacity: 0.8,
    cursor: 'pointer'
  },
  popupAddress: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    fontSize: 12,
    fontStyle: 'italic',
  },
  popupBio: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[800],
    fontSize: 14,
    lineHeight: '1.8em',
    display: '-webkit-box',
    "-webkit-line-clamp": 3,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 12,
  }
}))

const defaultCenter = {lat: 39.5, lng: -43.636047}

const SearchResultsMap = ({center = defaultCenter, zoom = 2, hits, classes}: {
  center: {lat: number, lng: number},
  zoom: number,
  hits: Array<Hit<AlgoliaUser>>,
  classes: ClassesType,
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
  
  const { StyledMapPopup } = Components
  
  const isEAForum = forumTypeSetting.get() === 'EAForum'
  
  return <div className={classes.root}>
    <Helmet>
      <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css' rel='stylesheet' />
    </Helmet>
    <ReactMapGL
      {...viewport}
      width="100%"
      height="100%"
      mapStyle={isEAForum ? undefined : "mapbox://styles/habryka/cilory317001r9mkmkcnvp2ra"}
      onViewportChange={viewport => setViewport(viewport)}
      mapboxApiAccessToken={mapboxAPIKeySetting.get() || undefined}
    >
      {hits.map(hit => {
        if (!hit._geoloc) return null
        
        return <React.Fragment key={hit._id}>
          <Marker
            latitude={hit._geoloc.lat}
            longitude={hit._geoloc.lng}
            offsetLeft={-8}
            offsetTop={-20}
          >
            <PersonIcon className={classes.icon} onClick={() => setActiveResultId(hit._id)} />
          </Marker>
          {(activeResultId === hit._id) && <StyledMapPopup
            lat={hit._geoloc.lat}
            lng={hit._geoloc.lng}
            link={userGetProfileUrl(hit)}
            title={hit.displayName}
            onClose={() => setActiveResultId('')}
            hideBottomLinks
          >
            <div className={classes.popupAddress}>{hit.mapLocationAddress}</div>
            {hit.htmlBio && <div className={classes.popupBio} dangerouslySetInnerHTML={{__html: hit.htmlBio}} />}
          </StyledMapPopup>}
        </React.Fragment>
      })}
    </ReactMapGL>
  </div>
}

// connectHits is probably nothing but a consumer acting as a HoC, like this:
// const connectHits = (C) => { const hits = useHits(); return (args) => C({...args, hits}); }
// It consumes the data provided by InstantSearch, which should be a parent of us
const SearchResultsMapComponent = registerComponent("SearchResultsMap", connectHits(SearchResultsMap), { styles });

declare global {
  interface ComponentTypes {
    SearchResultsMap: typeof SearchResultsMapComponent
  }
}
