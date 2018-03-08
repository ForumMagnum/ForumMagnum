/* global google */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Marker, InfoWindow } from "react-google-maps"
import { Link } from 'react-router';

class LocalEventMarker extends PureComponent {
  render() {
    const { event, handleMarkerClick, handleInfoWindowClose, infoOpen, location } = this.props;
    const { geometry: {location: {lat, lng}}} = location;

    var circleIcon = {
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
        icon={circleIcon}
        position={{lat:lat, lng:lng}}
      >
        {infoOpen &&
          <InfoWindow
            onCloseClick={() => handleInfoWindowClose(event._id)}
          >
            <div style={{maxWidth: "250px"}}>
              <h5> Local Event: {event.title} </h5>
              <Components.DraftJSRenderer content={event.content} />
              <Link to={'/posts/'+event._id}> Full link </Link>
            </div>
          </InfoWindow>
        }
      </Marker>
    )
  }
}

LocalEventMarker.propTypes = {
  event: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
}

registerComponent("LocalEventMarker", LocalEventMarker);
