/* global google */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components, Utils } from 'meteor/vulcan:core';
import FlatButton from 'material-ui/FlatButton';
import FontIcon from 'material-ui/FontIcon';
import { withScriptjs, withGoogleMap, GoogleMap, Marker, InfoWindow } from "react-google-maps"
import { convertFromRaw } from 'draft-js';

class LocalGroupMarker extends PureComponent {
  render() {
    const { group, handleMarkerClick, handleInfoWindowClose, infoOpen, location } = this.props;
    const { geometry: {location: {lat, lng}}} = location;

    let htmlBody = {__html: "<span>No description</span>"}
    try {
      const contentState = convertFromRaw(group.description);
      htmlBody = {__html: Utils.draftToHTML(contentState)};
    } catch(err) {
      console.log("invalid draftContentState", group.description, group._id);
    }

    var circleIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#588f27',
        fillOpacity: 0.6,
        scale: 8,
        strokeWeight: 0,
    };


    return(
      <Marker
        onClick={() => handleMarkerClick(group._id)}
        key={group._id}
        icon={circleIcon}
        position={{lat:lat, lng:lng}}
      >
        {infoOpen &&
          <InfoWindow
            onCloseClick={() => handleInfoWindowClose(group._id)}
          >
            <div>
              <h5> Local Group: {group.name} </h5>
              <div dangerouslySetInnerHTML={htmlBody}/>
            </div>
          </InfoWindow>
        }
      </Marker>
    )
  }
}

LocalGroupMarker.propTypes = {
  group: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
}

registerComponent("LocalGroupMarker", LocalGroupMarker);
