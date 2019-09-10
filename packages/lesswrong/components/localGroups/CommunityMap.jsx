import React, { useState } from 'react';
import { Components, registerComponent, useMulti, getSetting } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { Localgroups } from '../../lib/index.js';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import { useLocation } from '../../lib/routeUtil';
import mapStyle from './mapStyles.js';
import { GoogleMap, LoadScriptNext, MarkerClusterer } from "@react-google-maps/api"
import NoSSR from 'react-no-ssr';
import { personGoogleIcon } from './Icons'
import withDialog from '../common/withDialog'
import withUser from '../common/withUser.js';

const mapsAPIKey = getSetting('googleMaps.apiKey', null);

const mapsHeight = 440
const mapsWidth = "100vw"

const styles = theme => ({
  root: {
    width: mapsWidth,
    height: mapsHeight,
    // We give this a negative margin to make sure that the map is flush with the top
    marginTop: -50,
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
      marginLeft: -8
    }
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
    top: 10,
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
const libraries = ['places']
const defaultCenter = {lat: 37.871853, lng: -122.258423}
const CommunityMap = ({ groupTerms, eventTerms, initialOpenWindows = [], center = defaultCenter, zoom = 3, classes, showUsers, openDialog, currentUser, showHideMap = false }) => {
  const { query } = useLocation()
  const groupQueryTerms = groupTerms || {view: "all", filters: query?.filters || []}

  const [ openWindows, setOpenWindows ] = useState(initialOpenWindows)
  const handleClick = (id) => { setOpenWindows([id]) }
  const handleClose = (id) => { setOpenWindows(_.without(openWindows, id))}

  const [ showEvents, setShowEvents ] = useState(true)
  const [ showGroups, setShowGroups ] = useState(true)
  const [ showIndividuals, setShowIndividuals ] = useState(true)
  

  const { results: events = [] } = useMulti({
    terms: eventTerms,
    collection: Posts,
    queryName: "communityMapEventsQuery",
    fragmentName: "PostsList",
    limit: 500,
    ssr: true
  });

  const { results: groups = [] } = useMulti({
    terms: groupQueryTerms,
    collection: Localgroups,
    queryName: "communityMapQuery",
    fragmentName: "localGroupsHomeFragment",
    limit: 500,
    ssr: true
  })

  const { results: users = [] } = useMulti({
    terms: {view: "usersMapLocations"},
    collection: Users,
    queryName: "usersMapLocationQuery",
    fragmentName: "UsersProfile",
    limit: 500,
    ssr: true
  })

  return <div className={classes.root}>
    <NoSSR>
      {Meteor.isClient && <LoadScriptNext googleMapsApiKey={mapsAPIKey} libraries={libraries}>
        <GoogleMap
          center={center}
          zoom={zoom}
          mapContainerStyle={{
            height: `${mapsHeight}px`,
            width: mapsWidth
          }}
          mapContainerClassName={classes.communityMap}
          options={{
            styles: mapStyle,
            keyboardShortcuts: false,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false
          }}
        >
          {showEvents && <LocalEventsMapMarkers events={events} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />}
          {showGroups && <LocalGroupsMapMarkers groups={groups} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />}
          {showIndividuals && <PersonalMapLocationMarkers users={users} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />}
          <div className={classes.mapButtons}>
            <Components.CommunityMapFilter 
              showHideMap={showHideMap} 
              toggleEvents={() => setShowEvents(!showEvents)} showEvents={showEvents}
              toggleGroups={() => setShowGroups(!showGroups)} showGroups={showGroups}
              toggleIndividuals={() => setShowIndividuals(!showIndividuals)} showIndividuals={showIndividuals}
            />
          </div>
        </GoogleMap>
      </LoadScriptNext>}
    </NoSSR>
  </div>
}



const PersonalMapLocationMarkers = ({users, handleClick, handleClose, openWindows}) => {
  return <MarkerClusterer
    options={{imagePath:"/m"}}
  >
    { (clusterer) => users.map((user) => {
      const htmlBody = {__html: user.htmlMapMarkerText};
      return <Components.StyledMapMarker 
        location={user.mapLocation}
        handleOpen={() => handleClick(user._id)}
        handleClose={() => handleClose(user._id)}
        infoOpen={openWindows.includes(user._id)}
        icon={personGoogleIcon}
        link={Users.getProfileUrl(user)}
        title={` [User] ${Users.getDisplayName(user)} `}
        key={ user._id }
        clusterer={clusterer}
      >
        <div dangerouslySetInnerHTML={htmlBody} />
      </Components.StyledMapMarker>
    })}
  </MarkerClusterer>
}

const LocalEventsMapMarkers = ({events, handleClick, handleClose, openWindows}) => {
  return events.map((event) => {
    return <Components.LocalEventMarker
      key={event._id}
      event={event}
      handleMarkerClick={handleClick}
      handleInfoWindowClose={handleClose}
      infoOpen={openWindows.includes(event._id)}
      location={event.googleLocation}
    />
  })
}

const LocalGroupsMapMarkers = ({groups, handleClick, handleClose, openWindows}) => {
  return groups.map((group) => {
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
  })
}



registerComponent("CommunityMap", CommunityMap, withStyles(styles, {name: "CommunityMap"}), withDialog, withUser)
