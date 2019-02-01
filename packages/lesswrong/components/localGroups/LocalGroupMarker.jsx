/* global google */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Marker, InfoWindow } from "react-google-maps"
import { Link } from 'react-router';
import CloseIcon from '@material-ui/icons/Close';
import { withStyles } from '@material-ui/core/styles';

// Shared with LocalEventMarker
export const styles = theme => ({
  mapInfoWindow: {
    width: "250px",
    maxHeight: "250px",
    overflowX: "hidden",
    overflowY: "auto",
  },
  closeIcon: {
    position: "absolute",
    right: "-3px",
    top: "4px",
    color: "rgba(0,0,0,0.5)",
    height: "15px",
    width: "15px",
  },
  groupMarkerName: {
    fontSize: "15px",
    marginTop: "3.5px",
    marginBottom: "0px",
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
    bottom: "0px",
    right: "-2px",
  },
});

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
    const { group, handleMarkerClick, handleInfoWindowClose, infoOpen, location, classes } = this.props;
    const { geometry: {location: {lat, lng}}} = location;
    const { html = "" } = group.contents || {}
    const htmlBody = {__html: html};

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
            <div className={classes.mapInfoWindow}>
              <a><CloseIcon className={classes.closeIcon} onClick={() => handleInfoWindowClose(group._id)}/></a>
              <Link to={'/groups/'+group._id}><h5 className={classes.groupMarkerName}> [Group] {group.name} </h5></Link>
              <div dangerouslySetInnerHTML={htmlBody} className={classes.markerBody}></div>
              {group.contactInfo && <div className={classes.contactInfo}>{group.contactInfo}</div>}
              <Link className={classes.markerPageLink} to={'/groups/'+group._id}> Full link </Link>
              <div className={classes.linksWrapper}><Components.GroupLinks document={group}/></div>
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

registerComponent("LocalGroupMarker", LocalGroupMarker, withStyles(styles, { name: "LocalGroupMarker" }));
