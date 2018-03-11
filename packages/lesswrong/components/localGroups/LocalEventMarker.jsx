/* global google */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Marker, InfoWindow } from "react-google-maps"
import { Link } from 'react-router';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import { Posts } from 'meteor/example-forum';

class LocalEventMarker extends PureComponent {
  render() {
    const { event, handleMarkerClick, handleInfoWindowClose, infoOpen, location } = this.props;
    console.log("LocalEventMarker location", location);
    const { geometry: {location: {lat, lng}}} = location || {geometry: {location: {lat: -98.44228020000003, lng: 35.1592256}}};

    var arrowIcon = {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: '#2b6a99',
        fillOpacity: 0.9,
        scale: 5,
        strokeWeight: 0,
    };


    return(
      <Marker
        onClick={() => handleMarkerClick(event._id)}
        key={event._id}
        icon={arrowIcon}
        position={{lat:lat, lng:lng}}
      >
        {infoOpen &&
          <InfoWindow>
            <div style={{maxWidth: "250px"}}>
              <a><CloseIcon className="local-group-marker-close-icon" onClick={() => handleInfoWindowClose(event._id)}/></a>
              <Link to={Posts.getPageUrl(event)}><h5 className="local-group-marker-name"> [Event] {event.title} </h5></Link>
              <Components.DraftJSRenderer content={event.content} />
              {event.contactInfo && <div className="local-group-marker-contact-info">{event.contactInfo}</div>}
              <Link className="local-group-marker-page-link" to={Posts.getPageUrl(event)}> Full link </Link>
              <Components.GroupLinks document={event}/>
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

registerComponent("LocalEventMarker", LocalEventMarker);
