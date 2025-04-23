import { NavigationContext } from "@/lib/vulcan-core/appContext";
import { useContext, useCallback, useEffect } from "react";

export function useWarnAboutUnsavedChanges(isChangedFunc: () => boolean) {
  const navigationContext = useContext(NavigationContext);
  const history = navigationContext?.history;

  const checkRouteChange = useCallback(() => {
    return history?.block(() => {
      if (isChangedFunc()) {
        return 'Discard changes?';
      }
    });
  }, [history, isChangedFunc]);

  const checkBrowserClosing = useCallback(() => {
    const handler = () => {
      if (isChangedFunc()) {
        return 'Discard changes?';
      }
    };

    window.addEventListener('beforeunload', handler);

    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [isChangedFunc]);

  useEffect(() => {
    const unblockRouteChange = checkRouteChange();
    const unblockBrowserClosing = checkBrowserClosing();

    return () => {
      unblockRouteChange?.();
      unblockBrowserClosing();
    };
  }, [checkBrowserClosing, checkRouteChange]);
}
