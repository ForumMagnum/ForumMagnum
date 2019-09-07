/* global google */
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Marker, InfoWindow } from "@react-google-maps/api"
import CloseIcon from '@material-ui/icons/Close';
import { registerComponent } from 'meteor/vulcan:core';

const styles = theme => ({
  mapInfoWindow: {
    width: "250px",
    maxHeight: "250px",
    overflowX: "hidden",
    overflowY: "auto",
  },
  closeIcon: {
    position: "absolute",
    right: 5,
    top: 5,
    color: "rgba(0,0,0,0.5)",
    height: "15px",
    width: "15px",
  },
})

const MarkerWithInfoWindow = ({position, markerIcon, onMarkerClick, onInfoWindowClose, key, infoOpen, clusterer, children, classes}) => {
    return <Marker
      onClick={onMarkerClick}
      key={key}
      icon={markerIcon}
      position={position}
      clusterer={clusterer}
    >
      {infoOpen &&
        <InfoWindow position={position} options={{pixelOffset: new google.maps.Size(0, -18)}}>
          <div className={classes.mapInfoWindow}>
            <a><CloseIcon className={classes.closeIcon} onClick={onInfoWindowClose}/></a>
            {children}
          </div>
        </InfoWindow>
      }
    </Marker>
}

registerComponent("MarkerWithInfoWindow", MarkerWithInfoWindow, withStyles(styles, { name: "MarkerWithInfoWindow" }));
