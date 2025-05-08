import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useLocation } from '../../lib/routeUtil';
import BadlyTypedReactMapGL, { Marker as BadlyTypedMarker } from 'react-map-gl';
import * as _ from 'underscore';
import { mapboxAPIKeySetting } from '../../lib/publicSettings';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/Person';
import classNames from 'classnames';
import { componentWithChildren, Helmet } from '../../lib/utils/componentsWithChildren';
import {isFriendlyUI} from '../../themes/forumTheme'
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { spreadMapMarkers } from '../../lib/utils/spreadMapMarkers';
import { useMapStyle } from '../hooks/useMapStyle';

const ReactMapGL = componentWithChildren(BadlyTypedReactMapGL);
const Marker = componentWithChildren(BadlyTypedMarker);

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    height: 440,
    // We give this a negative margin to make sure that the map is flush with the top
    marginTop: -50,
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
  communityMap: {},
  mapButton: {
    padding: 10,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    borderRadius: 2,
    width: 120,
    marginBottom: theme.spacing.unit
  },
  hideMap: {
    width: 34,
    padding: 5
  },
  buttonText: {
    marginLeft: 10,
    fontWeight: 500,
    fontFamily: "Roboto",
  },
  mapButtons: {
    alignItems: "flex-end",
    position: "absolute",
    top: isFriendlyUI ? 40 : 10,
    right: 10,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down('md')]: {
      top: 24
    }
  },
  filters: {
    width: 100
  }
});

// Make these variables have file-scope references to avoid rerending the scripts or map
export const defaultCenter = {lat: 39.5, lng: -43.636047}
const CommunityMapInner = ({ groupTerms, eventTerms, keywordSearch, initialOpenWindows = [], center = defaultCenter, zoom = 2, classes, className = '', showGroupsByDefault, showUsersByDefault, showHideMap = false, hideLegend }: {
  groupTerms: LocalgroupsViewTerms,
  eventTerms?: PostsViewTerms,
  keywordSearch?: string,
  initialOpenWindows: Array<string>,
  center?: {lat: number, lng: number},
  zoom: number,
  classes: ClassesType<typeof styles>,
  className?: string,
  showUsersByDefault?: boolean,
  showGroupsByDefault?: boolean,
  showHideMap?: boolean,
  hideLegend?: boolean,
  petrovButton?: boolean,
}) => {
  const { query } = useLocation()
  const groupQueryTerms: LocalgroupsViewTerms = groupTerms || {view: "all", filters: query?.filters || [], includeInactive: query?.includeInactive === 'true'}

  const [ openWindows, setOpenWindows ] = useState(initialOpenWindows)
  const handleClick = useCallback(
    (id: string) => { setOpenWindows([id]) }
    , []
  )
  const handleClose = useCallback(
    (id: string) => { setOpenWindows(_.without(openWindows, id))}
    , [openWindows]
  )

  const [ showEvents, setShowEvents ] = useState(true)
  const [ showGroups, setShowGroups ] = useState(!!showGroupsByDefault)
  const [ showUsers, setShowUsers ] = useState(!!showUsersByDefault)
  const [ showMap, setShowMap ] = useState(true)

  const [ viewport, setViewport ] = useState({
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

  const { results: events = [] } = useMulti({
    terms: eventTerms || {view: 'events'},
    collectionName: "Posts",
    fragmentName: "PostsList",
    limit: 500,
    skip: !eventTerms
  });

  const { results: groups = [] } = useMulti({
    terms: groupQueryTerms,
    collectionName: "Localgroups",
    fragmentName: "localGroupsHomeFragment",
    limit: 500,
    skip: !showGroups
  })
  // filter the list of groups if the user has typed in a keyword
  let visibleGroups = groups
  if (keywordSearch) {
    visibleGroups = groups.filter(group => (
      `${group.name.toLowerCase()} ${group.location?.toLowerCase()}`.includes(keywordSearch.toLowerCase())
    ))
  }

  const { results: users = [] } = useMulti({
    terms: {view: "usersMapLocations"},
    collectionName: "Users",
    fragmentName: "UsersMapEntry",
    limit: 5000,
    skip: !showUsers
  })

  const mapStyle = useMapStyle();

  const renderedMarkers = useMemo(() => {
    return <React.Fragment>
      {showEvents && <LocalEventsMapMarkers events={events} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />}
      {showGroups && <LocalGroupsMapMarkers groups={visibleGroups} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />}
      {showUsers && <Components.PersonalMapLocationMarkers users={users} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />}
      {!hideLegend && <div className={classes.mapButtons}>
        <Components.CommunityMapFilter 
          showHideMap={showHideMap} 
          toggleEvents={() => setShowEvents(!showEvents)} showEvents={showEvents}
          toggleGroups={() => setShowGroups(!showGroups)} showGroups={showGroups}
          toggleIndividuals={() => setShowUsers(!showUsers)} 
          showIndividuals={showUsers}
          setShowMap={setShowMap}
        />
      </div>}
    </React.Fragment>
  }, [showEvents, events, handleClick, handleClose, openWindows, showGroups, visibleGroups, showUsers, users, classes.mapButtons, showHideMap, hideLegend])

  if (!showMap) return null

  return <div className={classNames(classes.root, {[className]: className})}>
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
        {renderedMarkers}
      </ReactMapGL>
      {/*{petrovButton && <Components.PetrovDayButton />}*/}
  </div>
}

const personalMapMarkerStyles = (theme: ThemeType) => ({
  icon: {
    height: 20,
    width: 20,
    fill: theme.palette.individual,
    opacity: 0.8
  }
})
const PersonalMapLocationMarkersInner = ({users, handleClick, handleClose, openWindows, classes}: {
  users: Array<UsersMapEntry>,
  handleClick: (userId: string) => void,
  handleClose: (userId: string) => void,
  openWindows: any,
  classes: ClassesType<typeof personalMapMarkerStyles>,
}) => {
  const { StyledMapPopup } = Components
  
  const mapLocations = filterNonnull(users.map(user => {
    const location = user.mapLocationLatLng
    if (!location) return null
    
    const {lat, lng} = location
    if (typeof lat !== 'number' || typeof lng !== 'number') return null
    
    return {
      lat, lng,
      data: user,
    }
  }));
  
  const spreadMapLocations = spreadMapMarkers(mapLocations, u=>u.displayName);
  
  return <React.Fragment>
    {spreadMapLocations.map(({lat, lng, data: user}) => {
      const htmlBody = {__html: user.htmlMapMarkerText ?? ''};
      return <React.Fragment key={user._id}>
        <Marker
          latitude={lat}
          longitude={lng}
          offsetLeft={-8}
          offsetTop={-20}
        >
          <span onClick={() => handleClick(user._id)}>
            <PersonIcon className={classes.icon}/>
          </span>
        </Marker>
        {openWindows.includes(user._id) && 
          <StyledMapPopup
            lat={lat}
            lng={lng}
            link={userGetProfileUrl(user)}
            title={` [User] ${userGetDisplayName(user)} `}
            onClose={() => handleClose(user._id)}
          >
            <div dangerouslySetInnerHTML={htmlBody} />
          </StyledMapPopup>}
      </React.Fragment>
    })}
  </React.Fragment>
}
export const PersonalMapLocationMarkersTypes = registerComponent("PersonalMapLocationMarkers", PersonalMapLocationMarkersInner, {
  styles: personalMapMarkerStyles
});

const LocalEventsMapMarkers = ({events, handleClick, handleClose, openWindows}: {
  events: Array<PostsList>,
  handleClick: (eventId: string) => void,
  handleClose: (eventId: string) => void,
  openWindows: any,
}) => {
  return <>{events.map((event) => {
    return <Components.LocalEventMarker
      key={event._id}
      event={event}
      handleMarkerClick={handleClick}
      handleInfoWindowClose={handleClose}
      infoOpen={openWindows.includes(event._id)}
      location={event.googleLocation}
    />
  })}</>
}

const LocalGroupsMapMarkers = ({groups, handleClick, handleClose, openWindows}: {
  groups: Array<localGroupsHomeFragment>,
  handleClick: (eventId: string) => void,
  handleClose: (eventId: string) => void,
  openWindows: any,
}) => {
  return <>{groups.map((group) => {
    return(
      <Components.LocalGroupMarker
        key={group._id}
        group={group}
        handleMarkerClick={handleClick}
        handleInfoWindowClose={handleClose}
        infoOpen={openWindows.includes(group._id)}
        location={group.googleLocation}
      />
    )
  })}</>
}



export const CommunityMap = registerComponent("CommunityMap", CommunityMapInner, { styles });

declare global {
  interface ComponentTypes {
    CommunityMap: typeof CommunityMap
    PersonalMapLocationMarkers: typeof PersonalMapLocationMarkersTypes
  }
}
