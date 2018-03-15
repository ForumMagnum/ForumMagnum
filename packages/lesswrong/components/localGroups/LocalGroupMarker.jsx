/* global google */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Marker, InfoWindow } from "react-google-maps"
import { Link } from 'react-router';
import CloseIcon from 'material-ui/svg-icons/navigation/close';

class LocalGroupMarker extends PureComponent {
  // March 13th 2018: If this is still around in six months, probably time to say goodbye
  // getIconColor = () => {
  //   const type = this.props.group && this.props.group.type;
  //   switch (type) {
  //     case 'LW':
  //       return "#588f27";
  //     case 'SSC':
  //       return "#88ACB8";
  //     case 'EA':
  //       return '#1d879c';
  //     default:
  //       return '#444444';
  //   }
  // }

  render() {
    const { group, handleMarkerClick, handleInfoWindowClose, infoOpen, location } = this.props;
    const { geometry: {location: {lat, lng}}} = location;

    var circleIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#588f27",
        fillOpacity: 0.9,
        scale: 7,
        strokeWeight: 1,
        strokeColor: "#FFFFFF",
    };

    return(
      <Marker
        onClick={() => handleMarkerClick(group._id)}
        key={group._id}
        icon={circleIcon}
        position={{lat:lat, lng:lng}}
      >
        {infoOpen &&
          <InfoWindow>
            <div style={{width: "250px"}}>
              <a><CloseIcon className="local-group-marker-close-icon" onClick={() => handleInfoWindowClose(group._id)}/></a>
              <Link to={'/groups/'+group._id}><h5 className="local-group-marker-name"> [Group] {group.name} </h5></Link>
              <div className="local-group-marker-body"><Components.DraftJSRenderer content={group.description} /></div>
              {group.contactInfo && <div className="local-group-marker-contact-info">{group.contactInfo}</div>}
              <Link className="local-group-marker-page-link" to={'/groups/'+group._id}> Full link </Link>
              <div className="local-group-links-wrapper"><Components.GroupLinks document={group}/></div>
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
