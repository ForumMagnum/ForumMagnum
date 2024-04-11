import { WrappedReactMapGL } from './react-map-gl';
import { useLoadedLibrary } from './useLoadedLibrary';

export function useReactMapGL(): {
  ready: true,
  reactMapGL: WrappedReactMapGL,
} | {
  ready: false,
  reactMapGL: null,
} {
  const result = useLoadedLibrary<WrappedReactMapGL>({
    path: "/js/react-map-gl.js",
    serverVersion: () => bundleIsServer ? require('./react-map-gl') : null,
    windowField: "reactMapGL",
  });
  if (result.ready) {
    return { ready: true, reactMapGL: result.library };
  } else {
    return { ready: false, reactMapGL: null };
  }
}
