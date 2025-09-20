import type { AbstractThemeOptions } from '../../themes/themeNames';
import type { SSRMetadata } from '../utils/timeUtil';

declare global {
  // Typechecking for things we add to the window object on the client.
  // These are generally inserted into the SSR'ed document using the
  // embedAsGlobalVar function (in renderUtil), then read by the client in
  // various places. These should NOT be being read anywhere by the server,
  // or in shared code.
  interface Window {
    tabId: string | null;
    themeOptions: AbstractThemeOptions,
    ssrMetadata?: SSRMetadata
    publicSettings: any,
    publicInstanceSettings: any,
    __APOLLO_STATE__: any,
    __APOLLO_FOREIGN_STATE__: any,
    missingMainStylesheet?: boolean,
    __replayEvents?: () => void,
    
    googleMapsFinishedLoading?: () => void,
    killPreloadScroll?: () => void,
    Intercom: any,
    grecaptcha?: any,
    google?: any,
    isReturningVisitor?: boolean,
    serverInsertedStyleNodes?: HTMLStyleElement[]|null,

    /**
     * Next has a bug (https://github.com/vercel/next.js/issues/73426)
     * which means that it doesn't prefetch (or treat as having been prefetched)
     * the initial route that's SSR'd.  So if you land on the home page, navigate
     * to another page, and then navigate back to the home page, the navigation
     * to the home page will involve a loading state transition if there's a 
     * root loading.tsx file, or a noticeable delay if not.
     * 
     * We solve this by calling a `useEffect` inside of `ClientAppGenerator`
     * to call router.refresh(), but only if this flag hasn't been set yet,
     * to prevent it from triggering on every single page navigation.
     */
    initialRouteRefreshed?: boolean,
  }
}
