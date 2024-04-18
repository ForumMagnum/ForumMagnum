import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import { mapboxAPIKeySetting } from '../../lib/publicSettings';
import {isFriendlyUI} from '../../themes/forumTheme'
import { useReactMapGL } from '../../splits/useReactMapGl';
import { Helmet } from '../../lib/utils/componentsWithChildren';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  previewWrapper: {
    paddingTop: 5,
    height: 200,
    maxWidth: 300
  }
}));

const SmallMapPreview = ({post, group, zoom, classes}: {
  post: PostsList,
  group?: any,
  zoom?: number,
  classes: ClassesType,
}) => {
  const { ready, reactMapGL } = useReactMapGL();
  let document = (post || group);
  const googleLocation = document.googleLocation
  let center = googleLocation?.geometry?.location
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [viewport, setViewport] = useState(center && {
    latitude: center.lat,
    longitude: center.lng,
    zoom: zoom || 13
  });

  const handleMarkerClick = (id: string) => {
    setOpenWindows([...openWindows, id]);
  }

  const handleInfoWindowClose = (id: string) => {
    setOpenWindows(_.without(openWindows, id))
  }

  if (!viewport) return null
  if (!ready) return <Components.Loading/>;
  const { ReactMapGL } = reactMapGL;

  return <div className={classes.previewWrapper}>
    <Helmet> 
      <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css' rel='stylesheet' />
    </Helmet>
    <ReactMapGL
      {...viewport}
      width="100%"
      height="100%"
      mapStyle={isFriendlyUI ? undefined : "mapbox://styles/habryka/cilory317001r9mkmkcnvp2ra"}
      onViewportChange={viewport => setViewport(viewport)}
      mapboxApiAccessToken={mapboxAPIKeySetting.get()}
    >
        {post && <Components.LocalEventMarker
          key={post._id}
          event={post}
          location={post.googleLocation}
          handleMarkerClick={handleMarkerClick}
          handleInfoWindowClose={handleInfoWindowClose}
          infoOpen={openWindows.includes(post._id)}
        />}
        {group && <Components.LocalGroupMarker
          key={group._id}
          group={group}
          location={group.googleLocation}
          handleMarkerClick={handleMarkerClick}
          handleInfoWindowClose={handleInfoWindowClose}
          infoOpen={openWindows.includes(group._id)}
        />}
    </ReactMapGL>
  </div>
}

const SmallMapPreviewComponent = registerComponent("SmallMapPreview", SmallMapPreview, {styles});

declare global {
  interface ComponentTypes {
    SmallMapPreview: typeof SmallMapPreviewComponent
  }
}

