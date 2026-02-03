'use client';

import React from 'react';
import { componentWithChildren } from '@/lib/utils/componentsWithChildren';
import { Helmet } from "@/components/layout/Helmet";
import BadlyTypedReactMapGL, { InteractiveMapProps } from 'react-map-gl';
import { useMapStyle } from '../hooks/useMapStyle';
import { mapboxAPIKeySetting } from '@/lib/instanceSettings';
import { usePathname } from 'next/navigation';
import withErrorBoundary from '../common/withErrorBoundary';
import { registerComponent } from '@/lib/vulcan-lib/components';
const ReactMapGL = componentWithChildren(BadlyTypedReactMapGL);

interface AddedProps {
  mapStyle?: never,
  mapboxApiAccessToken?: never,
  children?: React.ReactNode
}
type WrappedReactMapGLProps = InteractiveMapProps & AddedProps;

export type MapboxViewport = {
  latitude: number
  longitude: number
  zoom: number
}

const WrappedReactMapGLInner = (props: InteractiveMapProps & AddedProps) => {
  const mapStyle = useMapStyle();
  const pathname = usePathname();

  return <>
    <Helmet name="mapbox">
      <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css" rel="stylesheet" />
    </Helmet>
    <ReactMapGL
      {...props}
      // Something about mapbox breaks when restored from within a suspended Activity boundary.
      // This key forces a rerender when users navigate away from and back any page that renders mapbox,
      // which fixes whatever the underlying problem is.
      key={pathname}
      mapStyle={mapStyle}
      mapboxApiAccessToken={mapboxAPIKeySetting.get() ?? undefined}
    />
  </>;
}

export const WrappedReactMapGL = registerComponent<WrappedReactMapGLProps>("WrappedReactMapGL", WrappedReactMapGLInner, {
  hocs: [withErrorBoundary],
});
