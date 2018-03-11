import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import mapStyle from './mapStyles.js';
import { withScriptjs, withGoogleMap, GoogleMap } from "react-google-maps"

class SmallMapPreview extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      openWindows: props.initialOpenWindows,
    }
  }

  handleMarkerClick = (id) => {
    this.setState({openWindows: [...this.state.openWindows, id]})
  }

  handleInfoWindowClose = (id) => {
    this.setState({openWindows: _.without(this.state.openWindows, id)})
  }

  render() {
    const { post, group } = this.props;
    return (
      <GoogleMap
        defaultCenter={this.props.center}
        defaultZoom={this.props.zoom}
        options={{styles: mapStyle, keyboardShortcuts: false}}
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
    );
  }
}

registerComponent("SmallMapPreview", SmallMapPreview, withScriptjs, withGoogleMap)
