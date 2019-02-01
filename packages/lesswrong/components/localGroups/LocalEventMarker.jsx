/* global google */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Marker, InfoWindow } from "react-google-maps"
import { Link } from 'react-router';
import CloseIcon from '@material-ui/icons/Close';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';

// Share JSS styles with LocalGroupMarkers
import { styles } from './LocalGroupMarker';

class LocalEventMarker extends PureComponent {
  render() {
    const { event, handleMarkerClick, handleInfoWindowClose, infoOpen, location, classes } = this.props;
    const { geometry: {location: {lat, lng}}} = location || {geometry: {location: {lat: -98.44228020000003, lng: 35.1592256}}};
    const { html = "" } = event.contents || {}
    var arrowIcon = {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: '#2b6a99',
        fillOpacity: 0.9,
        scale: 5,
        strokeWeight: 1,
        strokeColor: "#FFFFFF"
    };

    const htmlBody = {__html: html};
    return(
      <Marker
        onClick={() => handleMarkerClick(event._id)}
        key={event._id}
        icon={arrowIcon}
        position={{lat:lat, lng:lng}}
      >
        {infoOpen &&
          <InfoWindow>
            <div className={classes.mapInfoWindow}>
              <a><CloseIcon className={classes.closeIcon} onClick={() => handleInfoWindowClose(event._id)}/></a>
              <Link to={Posts.getPageUrl(event)}><h5 className={classes.groupMarkerName}> [Event] {event.title} </h5></Link>
              <div dangerouslySetInnerHTML={htmlBody} className={classes.markerBody}></div>
              {event.contactInfo && <div className={classes.contactInfo}>{event.contactInfo}</div>}
              <Link className={classes.markerPageLink} to={Posts.getPageUrl(event)}> Full link </Link>
              <div className={classes.linksWrapper}><Components.GroupLinks document={event}/></div>
            </div>
          </InfoWindow>
        }
      </Marker>
    )
  }
}

LocalEventMarker.propTypes = {
  event: PropTypes.object.isRequired,
  location: PropTypes.object,
}

registerComponent("LocalEventMarker", LocalEventMarker, withStyles(styles, { name: "LocalEventMarker" }));
