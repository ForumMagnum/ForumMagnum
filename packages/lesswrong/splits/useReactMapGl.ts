import { useLoadedLibrary } from './useLoadedLibrary';

type WrappedReactMapGL = any;

export function useReactMapGL(): {
  ready: boolean,
  reactMapGL: WrappedReactMapGL,
} {
  const result = useLoadedLibrary<WrappedReactMapGL>({
    path: "/js/react-map-gl.js",
    windowField: "reactMapGL",
  });
  return { ready: result.ready, reactMapGL: result.ready ? result.library : null };
}
