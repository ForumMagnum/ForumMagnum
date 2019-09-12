import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '../../lib/reactRouterWrapper.js';
import { registerComponent, Components } from 'meteor/vulcan:core';

// Shared with LocalEventMarker
export const styles = theme => ({
  groupMarkerName: {
    fontSize: "15px",
    marginTop: "3.5px",
    marginBottom: "0px",
    marginRight: 10
  },
  markerBody: {
    marginTop: 10,
    marginBottom: 10,
  },
  contactInfo: {
    marginBottom: "10px",
    marginTop: "10px",
    fontWeight: 400,
    color: "rgba(0,0,0,0.6)",
  },
  markerPageLink: {
    fontWeight: 400,
    color: "rgba(0,0,0,0.4)",
  },
  linksWrapper: {
    position: "absolute",
    right: 10,
  },
});

const StyledMapMarker = ({ 
    children, 
    location, 
    handleOpen, 
    handleClose,
    infoOpen, 
    classes, 
    icon, 
    link, 
    title,
    metaInfo,
    cornerLinks,
    clusterer
  }) => {
    if (!location?.geometry?.location?.lat || !location?.geometry?.location?.lng) return null
    const { geometry: {location: {lat, lng}}} = location
    const { MarkerWithInfoWindow } = Components
    return <MarkerWithInfoWindow
      position={{lat, lng}}
      markerIcon={icon}
      onMarkerClick={handleOpen}
      onInfoWindowClose={handleClose}
      clusterer={clusterer}
      infoOpen={infoOpen}>
        <Link to={link}><h5 className={classes.groupMarkerName}> {title} </h5></Link>
        <div className={classes.markerBody}>{children}</div>
        {metaInfo && <div className={classes.contactInfo}>{metaInfo}</div>}
        <Link className={classes.markerPageLink} to={link}> Full link </Link>
        <div className={classes.linksWrapper}>{cornerLinks}</div>
    </MarkerWithInfoWindow> 
}

registerComponent("StyledMapMarker", StyledMapMarker, withStyles(styles, { name: "StyledMapMarker" }))
