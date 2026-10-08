// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { useEffect, useState } from "react";

import type { Emitter } from "@excalidraw/common";

export const useEmitter = <TEvent extends unknown>(
  emitter: Emitter<[TEvent]>,
  initialState: TEvent,
) => {
  const [event, setEvent] = useState<TEvent>(initialState);

  useEffect(() => {
    const unsubscribe = emitter.on((event) => {
      setEvent(event);
    });

    return () => {
      unsubscribe();
    };
  }, [emitter]);

  return event;
};
