import React, { Component } from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import ReactMapGL from 'react-map-gl';
import { Helmet } from 'react-helmet'

const mapboxAPIKey = getSetting('mapbox.apiKey', null);

const styles = theme => ({
  previewWrapper: {
    paddingTop: 5,
    marginBottom: 20,
    height: 400
  }
});

const defaultLocation = {lat: 37.871853, lng: -122.258423};
class SmallMapPreview extends Component {
  constructor(props, context) {
    super(props);
    let document = this.getDocument()
    const googleLocation = document.googleLocation
    let center = googleLocation?.geometry?.location || defaultLocation
    this.state = {
      openWindows: [],
      viewport: {
        latitude: center.lat,
        longitude: center.lng,
        zoom: this.props.zoom || 13
      }
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
    const { post, group, classes } = this.props
    const { viewport } = this.state

    return <div className={classes.previewWrapper}>
      <Helmet> 
        <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css' rel='stylesheet' />
      </Helmet>
      <ReactMapGL
        {...viewport}
        width="100%"
        height="100%"
        mapStyle={"mapbox://styles/habryka/cilory317001r9mkmkcnvp2ra"}
        onViewportChange={viewport => this.setState({ viewport })}
        mapboxApiAccessToken={mapboxAPIKey}
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
      </ReactMapGL>
    </div>
  }
}

registerComponent("SmallMapPreview", SmallMapPreview, withStyles(styles, {name: "SmallMapPreview"}))
