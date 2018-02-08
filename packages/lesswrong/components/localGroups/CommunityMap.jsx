/* global google */
import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import { Components, registerComponent, withCurrentUser, getFragment, withList, Utils} from 'meteor/vulcan:core';
import { LocalGroups } from '../../lib/index.js';
import mapStyle from './mapStyles.js';
import { withScriptjs, withGoogleMap, GoogleMap, Marker, InfoWindow } from "react-google-maps"


const markerIconUrl = "http://res.cloudinary.com/lesswrong-2-0/image/upload/v1518060892/noun_210423_cc_g4ee2d.svg"

const circlePath = "M50,95.112c24.853,0,45-20.147,45-45c0-24.853-20.147-45-45-45c-24.853,0-45,20.147-45,45   C5,74.965,25.147,95.112,50,95.112z M50,27.612c12.426,0,22.5,10.074,22.5,22.5c0,12.426-10.074,22.5-22.5,22.5   s-22.5-10.074-22.5-22.5C27.5,37.686,37.574,27.612,50,27.612z"

class CommunityMap extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      openWindows: [],
    }
  }

  handleMarkerClick = (groupId) => {
    this.setState({openWindows: [...this.state.openWindows, groupId]})
  }

  handleInfoWindowClose = (groupId) => {
    this.setState({openWindows: _.without(this.state.openWindows, groupId)})
  }

  renderLocalGroups = () => {
    const localGroups = this.props.results;
    if (localGroups) {
      return localGroups.map((group) => {
        return(
          <Components.LocalGroupMarker
            key={group._id}
            group={group}
            handleMarkerClick={this.handleMarkerClick}
            handleInfoWindowClose={this.handleInfoWindowClose}
            infoOpen={this.state.openWindows.includes(group._id)}
            location={group.googleLocation}
          />
        )
      })
    }
  }

  render() {
    return (
      <GoogleMap
        defaultCenter={this.props.center}
        defaultZoom={this.props.zoom}
        options={{styles: mapStyle}}
      >
        {this.renderLocalGroups()}
      </GoogleMap>
    );
  }
}

<div style={{height: "500px"}} className="community-map"/>

CommunityMap.defaultProps = {
  googleMapURL: "https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places",
  loadingElement: <div style={{ height: `100%` }} />,
  containerElement: <div style={{ height: `400px` }} />,
  mapElement: <div style={{ height: `100%` }} />,
  center: {lat: 37.871853, lng: -122.258423},
  zoom: 3
}

const listOptions = {
  collection: LocalGroups,
  queryName: "communityMapQuery",
  fragmentName: "localGroupsHomeFragment"
}

registerComponent("CommunityMap", CommunityMap, [withList, listOptions], withScriptjs, withGoogleMap)
