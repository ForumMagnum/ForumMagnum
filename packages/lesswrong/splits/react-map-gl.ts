// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import ReactMapGL, { Marker, Popup } from 'react-map-gl';

export type WrappedReactMapGL = {
  ReactMapGL: typeof ReactMapGL
  Marker:     typeof Marker
  Popup:      typeof Popup
};

declare global {
  interface Window {
    reactMapGL: WrappedReactMapGL|null;
  }
}

const wrappedReactMapGL: WrappedReactMapGL = { ReactMapGL, Marker, Popup };
if (!bundleIsServer) {
  window.reactMapGL = wrappedReactMapGL
}
