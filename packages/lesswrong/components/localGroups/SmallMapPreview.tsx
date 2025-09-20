import React, { useCallback, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import without from 'lodash/without';
import LocalEventMarker from "./LocalEventMarker";
import LocalGroupMarker from "./LocalGroupMarker";
import { WrappedReactMapGL } from '../community/WrappedReactMapGL';

const styles = (_theme: ThemeType) => ({
  previewWrapper: {
    paddingTop: 5,
    height: 200,
    maxWidth: 300
  }
});

const SmallMapPreview = ({post, group, zoom, classes}: {
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


  if (!viewport) {
    return null;
  }

  return (
    <div className={classes.previewWrapper}>
      <WrappedReactMapGL
        {...viewport}
        width="100%"
        height="100%"
        onViewportChange={setViewport}
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
      </WrappedReactMapGL>
    </div>
  );
}

export default registerComponent("SmallMapPreview", SmallMapPreview, {styles});


