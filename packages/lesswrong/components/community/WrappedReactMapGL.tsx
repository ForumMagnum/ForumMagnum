import React from 'react';
import { componentWithChildren } from '@/lib/utils/componentsWithChildren';
import { Helmet } from "../common/Helmet";
import BadlyTypedReactMapGL, { InteractiveMapProps } from 'react-map-gl';
import { useMapStyle } from '../hooks/useMapStyle';
import { mapboxAPIKeySetting } from '@/lib/instanceSettings';
const ReactMapGL = componentWithChildren(BadlyTypedReactMapGL);

export const WrappedReactMapGL = (props: InteractiveMapProps & {
  mapStyle?: never,
  mapboxApiAccessToken?: never,
  children?: React.ReactNode
}) => {
  const mapStyle = useMapStyle();
  return <>
    <Helmet name="mapbox">
      <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css" rel="stylesheet" />
    </Helmet>
    <ReactMapGL
      {...props}
      mapStyle={mapStyle}
      mapboxApiAccessToken={mapboxAPIKeySetting.get() ?? undefined}
    />
  </>;
}
