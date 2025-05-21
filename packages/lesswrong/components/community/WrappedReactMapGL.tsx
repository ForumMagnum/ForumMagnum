import { componentWithChildren, Helmet } from '@/lib/utils/componentsWithChildren';
import React from 'react';
import BadlyTypedReactMapGL, { InteractiveMapProps } from 'react-map-gl';
import { useMapStyle } from '../hooks/useMapStyle';
const ReactMapGL = componentWithChildren(BadlyTypedReactMapGL);

export const WrappedReactMapGL = (props: InteractiveMapProps & {
  mapStyle?: never,
  children?: React.ReactNode
}) => {
  const mapStyle = useMapStyle();
  return <>
    <Helmet>
      <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css" rel="stylesheet" />
    </Helmet>
    <ReactMapGL {...props} mapStyle={mapStyle} />
  </>;
}
