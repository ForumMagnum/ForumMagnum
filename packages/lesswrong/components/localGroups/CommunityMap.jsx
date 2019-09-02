/* global google */
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

const mapsAPIKey = getSetting('googleMaps.apiKey', null);

const mapsHeight = 440
const mapsWidth = "100vw"

const styles = theme => ({
  root: {
    width: mapsWidth,
    height: mapsHeight,
    // We give this a negative margin to make sure that the map is flush with the top
    marginTop: -64,
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
      marginLeft: -8
    }
  },
  communityMap: {}
});

// Make these variables have file-scope references to avoid rerending the scripts or map
const libraries = ['places']
const defaultCenter = {lat: 37.871853, lng: -122.258423}
const CommunityMap = ({ groupTerms, eventTerms, initialOpenWindows = [], center = defaultCenter, zoom = 3, classes, showUsers }) => {
  const { query } = useLocation()
  const groupQueryTerms = groupTerms || {view: "all", filters: query?.filters || []}
  const [ openWindows, setOpenWindows ] = useState(initialOpenWindows)
  const handleClick = (id) => { setOpenWindows([...openWindows, id]) }
  const handleClose = (id) => { setOpenWindows(_.without(openWindows, id))}

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
            fullscreenControl: false
          }}
        >
          <LocalEventsMapMarkers events={events} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />
          <LocalGroupsMapMarkers groups={groups} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />
          <PersonalMapLocationMarkers users={users} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />
          <Components.CommunityMapFilter />
        </GoogleMap>
      </LoadScriptNext>}
    </NoSSR>
  </div>
}
  
const personIcon = {
  path: "M6.46 5.3C7.52 3.81 5.49 2.11 3.15 1.19 2.26 1.8 1.17 2.17 0 2.17 -1.17 2.17 -2.25 1.8 -3.14 1.19 -5.48 2.11 -7.52 3.81 -6.46 5.3 -4.62 7.9 4.62 7.9 6.46 5.3zM4.58 -3.18C4.58 -0.71 2.53 1.3 0 1.3 -2.52 1.3 -4.57 -0.71 -4.57 -3.18 -4.57 -5.65 -2.52 -7.65 0 -7.65 4.24 -7.63 4.58 -3.18 4.58 -3.18zM3.61 -6.58M-12.78 -12.21",
  fillColor: '#588f27',
  fillOpacity: 0.9,
  scale: 1.25,
  strokeWeight: 1,
  strokeColor: "#FFFFFF"
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
        icon={personIcon}
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

registerComponent("CommunityMap", CommunityMap, withStyles(styles, {name: "CommunityMap"}))
