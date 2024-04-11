import { useRerender } from '../components/hooks/useFirstRender';
import { isClient } from '../lib/executionEnvironment';

const libraryLoadStatus: Record<string, "loading"|"ready"> = {};

export function useLoadedLibrary<T>({path, serverVersion, windowField}: {
  path: string,
  serverVersion: () => T|null,
  windowField: string,
}): { ready: false } | { ready: true, library: T } {
  const rerender = useRerender();
  
  if (isClient) {
    if (libraryLoadStatus[path] === 'ready') {
      return {
        ready: true,
        library: (window as any)[windowField],
      };
    }

    void (async () => {
      if (!(path in libraryLoadStatus)) {
        libraryLoadStatus[path] = "loading";
        const hash = window.splitFileHashes[path];
        await loadScript(`${path}?hash=${hash}`);
        libraryLoadStatus[path] = "ready";
        rerender();
      }
    })();

    return { ready: false };
  } else {
    return {
      ready: true,
      library: serverVersion()!,
    };
  }
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
