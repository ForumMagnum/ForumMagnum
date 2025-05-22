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
    
    googleMapsFinishedLoading?: () => void,
    killPreloadScroll?: () => void,
    Intercom: any,
    grecaptcha?: any,
    google?: any,
    isReturningVisitor?: boolean,
  }
}
