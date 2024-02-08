import { useRerender } from '../components/hooks/useFirstRender';
import { isClient } from '../lib/executionEnvironment';

type WrappedReactMapGL = any;

const libraryLoadStatus: Record<string, "loading"|"ready"> = {};

function useLoadedLibrary<T>({path, windowField}: {
  path: string,
  windowField: string,
}): { ready: false } | { ready: true, library: T } {
  const rerender = useRerender();
  
  if (libraryLoadStatus[path] === 'ready') {
    return {
      ready: true,
      library: (window as any)[windowField],
    };
  }

  if (isClient) {
    void (async () => {
      if (!(path in libraryLoadStatus)) {
        libraryLoadStatus[path] = "loading";
        await loadScript(path);
        libraryLoadStatus[path] = "ready";
        rerender();
      }
    })();
  }
  
  return { ready: false };
}

function loadScript(path: string): Promise<void> {
  return new Promise((ready, error) => {
    const head = document.head;
    const scriptTag = document.createElement("script")
    scriptTag.src = path;
    scriptTag.onload = () => ready();
    scriptTag.onerror = () => error();
    head.appendChild(scriptTag);
  });
}

export function useReactMapGL(): {
  ready: boolean,
  reactMapGL: WrappedReactMapGL,
} {
  const result =  useLoadedLibrary<WrappedReactMapGL>({
    path: "/js/react-map-gl.js",
    windowField: "reactMapGL",
  });
  return { ready: result.ready, reactMapGL: result.ready ? result.library : null };
}
