import React, { useCallback, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { mapboxAPIKeySetting } from '../../lib/publicSettings';
import { Helmet, componentWithChildren } from '../../lib/utils/componentsWithChildren';
import { useMapStyle } from '../hooks/useMapStyle';
import BadlyTypedReactMapGL from 'react-map-gl';
import without from 'lodash/without';
import { LocalEventMarker } from "./LocalEventMarker";
import { LocalGroupMarker } from "./LocalGroupMarker";

const ReactMapGL = componentWithChildren(BadlyTypedReactMapGL);

const styles = (_theme: ThemeType) => ({
  previewWrapper: {
    paddingTop: 5,
    height: 200,
    maxWidth: 300
  }
});

const SmallMapPreviewInner = ({post, group, zoom, classes}: {
  post: PostsList,
  group?: AnyBecauseTodo,
  zoom?: number,
  classes: ClassesType<typeof styles>,
}) => {
  const document = post || group;
  const googleLocation = document.googleLocation;
  const center = googleLocation?.geometry?.location;

  const [openWindows, setOpenWindows] = useState<AnyBecauseTodo[]>([]);
  const [viewport, setViewport] = useState(
    center
      ? {latitude: center.lat, longitude: center.lng, zoom: zoom || 13}
      : undefined
  );

  const onMarkerClick = useCallback((id: string) => {
    setOpenWindows((openWindows) => [...openWindows, id]);
  }, []);

  const onInfoWindowClose = useCallback((id: string) => {
    setOpenWindows((openWindows) => without(openWindows, id));
  }, []);

  const mapStyle = useMapStyle();

  if (!viewport) {
    return null;
  }

  return (
    <div className={classes.previewWrapper}>
      <Helmet>
        <link
          href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css"
          rel="stylesheet"
        />
      </Helmet>
      <ReactMapGL
        {...viewport}
        width="100%"
        height="100%"
        mapStyle={mapStyle}
        onViewportChange={setViewport}
        mapboxApiAccessToken={mapboxAPIKeySetting.get() ?? undefined}
      >
        {post && <LocalEventMarker
          key={post._id}
          event={post}
          location={post.googleLocation}
          handleMarkerClick={onMarkerClick}
          handleInfoWindowClose={onInfoWindowClose}
          infoOpen={openWindows.includes(post._id)}
        /> }
        {group && <LocalGroupMarker
          key={group._id}
          group={group}
          location={group.googleLocation}
          handleMarkerClick={onMarkerClick}
          handleInfoWindowClose={onInfoWindowClose}
          infoOpen={openWindows.includes(group._id)}
        />}
      </ReactMapGL>
    </div>
  );
}

export const SmallMapPreview = registerComponent("SmallMapPreview", SmallMapPreviewInner, {styles});

declare global {
  interface ComponentTypes {
    SmallMapPreview: typeof SmallMapPreview
  }
}
