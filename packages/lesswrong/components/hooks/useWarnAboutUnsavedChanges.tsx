// import { NavigationContext } from "@/lib/vulcan-core/appContext";
// import { useContext, useCallback, useEffect } from "react";

// export function useWarnAboutUnsavedChanges(isChangedFunc: () => boolean) {
//   const navigationContext = useContext(NavigationContext);
//   const history = navigationContext?.history;

//   const checkRouteChange = useCallback(() => {
//     // FIXME: We use `history.block` to prevent navigating away from a page with unsaved changes, but that API doesn't appear to exist in nextjs's router
//     return history?.block(() => {
//       if (isChangedFunc()) {
//         return 'Discard changes?';
//       }
//     });
//   }, [history, isChangedFunc]);

//   const checkBrowserClosing = useCallback(() => {
//     const handler = () => {
//       if (isChangedFunc()) {
//         return 'Discard changes?';
//       }
//     };

//     window.addEventListener('beforeunload', handler);

//     return () => {
//       window.removeEventListener('beforeunload', handler);
//     };
//   }, [isChangedFunc]);

//   useEffect(() => {
//     const unblockRouteChange = checkRouteChange();
//     const unblockBrowserClosing = checkBrowserClosing();

//     return () => {
//       unblockRouteChange?.();
//       unblockBrowserClosing();
//     };
//   }, [checkBrowserClosing, checkRouteChange]);
// }
