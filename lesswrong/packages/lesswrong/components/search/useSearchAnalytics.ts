import { useRef, useCallback } from "react";
import { useTracking } from "../../lib/analyticsEvents";

/**
 * A new search state is generated each time the user types a character.
 * Ideally, we don't want to capture a search event for every single
 * character that is typed - we just want the final, fully-typed search
 * query.
 * To do this we add a short timeout and only create the analytics event
 * after the user has stopped typing.
 */
export const useSearchAnalytics = (timeoutMS = 1000) => {
  const {captureEvent} = useTracking();
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const captureSearch = useCallback(
    (context: string, searchState: Record<string, unknown>) => {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        captureEvent("search", {context, ...searchState});
      }, timeoutMS);
    },
    [captureEvent, timeoutMS],
  );
  return captureSearch;
}
