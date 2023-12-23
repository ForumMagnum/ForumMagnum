import React, { Component } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { createStyles } from '@material-ui/core/styles';
import ReactMapGL from 'react-map-gl';
import * as _ from 'underscore';
import { mapboxAPIKeySetting } from '../../lib/publicSettings';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Helmet } from '../../lib/utils/componentsWithChildren';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  previewWrapper: {
    paddingTop: 5,
    height: 200,
    maxWidth: 300
  }
}));
interface SmallMapPreviewProps extends WithStylesProps {
  post: PostsList,
  group?: any,
  zoom?: number,
}
interface SmallMapPreviewState {
  openWindows: Array<any>,
  viewport: any,
}

class SmallMapPreview extends Component<SmallMapPreviewProps,SmallMapPreviewState> {
  constructor(props: SmallMapPreviewProps) {
    super(props);
    let document = this.getDocument()
    const googleLocation = document.googleLocation
    let center = googleLocation?.geometry?.location
    this.state = {
      openWindows: [],
      viewport: center && {
        latitude: center.lat,
        longitude: center.lng,
        zoom: this.props.zoom || 13
      }
    }
  }

  handleMarkerClick = (id: string) => {
    this.setState({openWindows: [...this.state.openWindows, id]})
  }

  handleInfoWindowClose = (id: string) => {
    this.setState({openWindows: _.without(this.state.openWindows, id)})
  }

  getDocument = () => {
    const { post, group } = this.props;
    return post || group
  }

  render() {
    const { post, group, classes } = this.props
    const { viewport } = this.state

    const isEAForum = forumTypeSetting.get() === 'EAForum';
    
    if (!viewport) return null

    return <div className={classes.previewWrapper}>
      <Helmet> 
        <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css' rel='stylesheet' />
      </Helmet>
      <ReactMapGL
        {...viewport}
        width="100%"
        height="100%"
        mapStyle={isEAForum ? undefined : "mapbox://styles/habryka/cilory317001r9mkmkcnvp2ra"}
        onViewportChange={viewport => this.setState({ viewport })}
        mapboxApiAccessToken={mapboxAPIKeySetting.get()}
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

const SmallMapPreviewComponent = registerComponent("SmallMapPreview", SmallMapPreview, {styles});

declare global {
  interface ComponentTypes {
    SmallMapPreview: typeof SmallMapPreviewComponent
  }
}

