import React, { Component } from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import mapStyle from './mapStyles.js';
import { GoogleMap, LoadScriptNext } from "@react-google-maps/api"
import { withStyles } from '@material-ui/core/styles';

const libraries = ['places']

const styles = theme => ({
  previewWrapper: {
    paddingTop: 5,
    marginBottom: 20,
  }
});

const defaultLocation = {lat: 37.871853, lng: -122.258423};
class SmallMapPreview extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      openWindows: [],
    }
  }

  handleMarkerClick = (id) => {
    this.setState({openWindows: [...this.state.openWindows, id]})
  }

  handleInfoWindowClose = (id) => {
    this.setState({openWindows: _.without(this.state.openWindows, id)})
  }

  getDocument = () => {
    const { post, group } = this.props;
    return post || group
  }

  render() {
    const { post, group, zoom = 11, classes } = this.props
    const mapsAPIKey = getSetting('googleMaps.apiKey', null)
    let document = this.getDocument()
    const googleLocation = document.googleLocation
    let center = googleLocation?.geometry?.location || defaultLocation

    return <div className={classes.previewWrapper}>
      <LoadScriptNext googleMapsApiKey={mapsAPIKey} libraries={libraries}>
        <GoogleMap
          center={center}
          zoom={zoom}
          mapContainerStyle={{
            height: `300px`,
            width: '100%'
          }}
          options={{
            styles: mapStyle,
            keyboardShortcuts: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {post && <Components.LocalEventMarker
          key={post._id}
          event={post}
          location={post.googleLocation}
          handleMarkerClick={this.handleMarkerClick}
          handleInfoWindowClose={this.handleInfoWindowClose}
          infoOpen={this.state.openWindows.includes(post._id)}
                  /> }
          {group && <Components.LocalGroupMarker
            key={group._id}
            group={group}
            location={group.googleLocation}
            handleMarkerClick={this.handleMarkerClick}
            handleInfoWindowClose={this.handleInfoWindowClose}
            infoOpen={this.state.openWindows.includes(group._id)}
                    />}
        </GoogleMap>
      </LoadScriptNext>
    </div>
  }
}

registerComponent("SmallMapPreview", SmallMapPreview, withStyles(styles, {name: "SmallMapPreview"}))
