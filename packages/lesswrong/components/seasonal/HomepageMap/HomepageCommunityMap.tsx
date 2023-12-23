import React, { useState, useCallback, useMemo } from 'react';
import { useUserLocation } from '../../../lib/collections/users/helpers';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useCurrentUser } from '../../common/withUser';
import BadlyTypedReactMapGL, { Marker as BadlyTypedMarker } from 'react-map-gl';
import { defaultCenter } from '../../localGroups/CommunityMap';
import { mapboxAPIKeySetting } from '../../../lib/publicSettings';
import { ArrowSVG } from '../../localGroups/Icons';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { useSingle } from '../../../lib/crud/withSingle';
import { ACX_EVENTS_LAST_UPDATED, LocalEvent, localEvents } from './acxEvents';
import classNames from 'classnames';
import moment from 'moment';
import { componentWithChildren, Helmet } from '../../../lib/utils/componentsWithChildren';

const ReactMapGL = componentWithChildren(BadlyTypedReactMapGL);
const Marker = componentWithChildren(BadlyTypedMarker);

const styles = (theme: JssStyles) => ({
  root: {
    width: "100%",
    height: 440,
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
      marginLeft: -8
    },
    position: "relative",
    boxShadow: theme.palette.boxShadow.default,
    
    "& .mapboxgl-popup-content": {
      background: theme.palette.panelBackground.default,
    },
    "& .StyledMapPopup-markerPageLink": {
      color: theme.palette.text.normal,
    },
  },
  mapButtons: {
    alignItems: "flex-end",
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down('md')]: {
      top: 24
    },
    ...theme.typography.body2
  },
})

const LocalEventWrapperPopUp = ({localEvent, handleClose}:{
  localEvent: LocalEvent,
  handleClose: (eventId: string)=>void
}) => {
  const { StyledMapPopup, GroupLinks } = Components
  const { document, loading } = useSingle({
    documentId: localEvent._id,
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  if (loading) return null

  if (!document) return null
  const { htmlHighlight = "" } = document.contents || {}
  const htmlBody = {__html: htmlHighlight};

  return <StyledMapPopup
    lat={localEvent.lat}
    lng={localEvent.lng}
    link={postGetPageUrl(document)}
    title={` [Event] ${document.title} `}
    metaInfo={document.contactInfo}
    cornerLinks={<GroupLinks document={document}/>}
    onClose={() => handleClose(document._id)}
    offsetTop={-15}
    offsetLeft={10}
  >
    <div dangerouslySetInnerHTML={htmlBody} />
  </StyledMapPopup>
}
const LocalEventWrapperPopUpComponent = registerComponent("LocalEventWrapperPopUp", LocalEventWrapperPopUp);


const localEventMapMarkerWrappersStyles = (theme: ThemeType): JssStyles => ({
  icon: {
    height: 20,
    width: 20,
    fill: theme.palette.event,
    opacity: 0.8,
    cursor: "pointer",
    '&:hover': {
      fill: theme.palette.primary.dark,
      opacity: 1
    }
  },
  iconSelected: {
    fill: theme.palette.primary.dark,
    opacity: 1
  }
})
const LocalEventMapMarkerWrappers = ({localEvents, classes}: {
  localEvents: Array<LocalEvent>,
  classes: ClassesType,
}) => {
  const { LocalEventWrapperPopUp } = Components
  const [ openWindows, setOpenWindows ] = useState<string[]>([])
  const handleClick = useCallback(
    (id: string) => { setOpenWindows([id]) }
    , []
  )
  const handleClose = useCallback((id: string) => { 
      setOpenWindows(openWindows.filter(windowId => windowId !== id))
    }, [openWindows]
  )

  // Sanity check that we updated the acxEvents.ts file with the new events.
  // If we didn't, it's much more obvious during testing that we forgot to update the map pins (since they'll be missing)
  const threeMonthsAgo = moment().subtract(3, 'months');
  if (threeMonthsAgo.isAfter(ACX_EVENTS_LAST_UPDATED)) {
    return null;
  }
  
  return <React.Fragment>
    {localEvents.map(localEvent => {
      const infoOpen = openWindows.includes(localEvent._id)
      return <React.Fragment key={`mapEvent${localEvent._id}`}>
      <Marker
        latitude={localEvent.lat}
        longitude={localEvent.lng}
        offsetLeft={-7}
        offsetTop={-25}
      >
        <span onClick={() => handleClick(localEvent._id)}>
          <ArrowSVG className={classNames(classes.icon, {[classes.iconSelected]: infoOpen})}/>
        </span>
      </Marker>
      {infoOpen && <LocalEventWrapperPopUp localEvent={localEvent} handleClose={handleClose}/>}
    </React.Fragment>
    })}
  </React.Fragment>
}
const LocalEventMapMarkerWrappersComponent = registerComponent("LocalEventMapMarkerWrappers", LocalEventMapMarkerWrappers, {
  styles: localEventMapMarkerWrappersStyles
});


export const HomepageCommunityMap = ({dontAskUserLocation = false, classes}: {
  dontAskUserLocation?: boolean,
  classes: ClassesType,
}) => {
  const { LocalEventMapMarkerWrappers, HomepageMapFilter } = Components

  const currentUser = useCurrentUser()
 
  // this is unused in this component, but for Meetup Month it seems good to force the prompt to enter location.
  useUserLocation(currentUser, dontAskUserLocation)

  const [ viewport, setViewport ] = useState({
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    zoom: 1.1
  })

  const renderedMarkers = useMemo(() => {
    return <>
      <LocalEventMapMarkerWrappers localEvents={localEvents} />
      <div className={classes.mapButtons}>
        <HomepageMapFilter />
      </div>
    </>
  }, [LocalEventMapMarkerWrappers, HomepageMapFilter, classes.mapButtons])
  
  return <div className={classes.root}>
    <Helmet> 
      <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css' rel='stylesheet' />
    </Helmet>
    <ReactMapGL
      {...viewport}
      width="100%"
      height="100%"
      mapStyle={"mapbox://styles/habryka/cilory317001r9mkmkcnvp2ra"}
      onViewportChange={viewport => setViewport(viewport)}
      mapboxApiAccessToken={mapboxAPIKeySetting.get() ?? undefined}
    >
      {renderedMarkers}
    </ReactMapGL>
  </div>;
}

const HomepageCommunityMapComponent = registerComponent('HomepageCommunityMap', HomepageCommunityMap, {styles});

declare global {
  interface ComponentTypes {
    HomepageCommunityMap: typeof HomepageCommunityMapComponent
    LocalEventMapMarkerWrappers: typeof LocalEventMapMarkerWrappersComponent
    LocalEventWrapperPopUp: typeof LocalEventWrapperPopUpComponent
  }
}

