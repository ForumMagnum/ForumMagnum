import '../client/publicSettings' // Must come first

// Imports required for this file:
import { filterConsoleLogSpam } from '../lib/consoleFilters';
import { randomId } from '../lib/random';

// Imports required for the whole app:
import '../client';
import { CLIENT_ID_COOKIE } from '../lib/cookies/cookies';
import { initAutoRefresh } from './autoRefresh';
import { rememberScrollPositionOnPageReload } from './scrollRestoration';
import { initLegacyRoutes } from '@/lib/routes';
import { hydrateClient } from './start';
import { googleTagManagerInit } from './ga';
import { initReCaptcha } from './reCaptcha';
import './type3';
import { initDatadog } from './datadogRum';
import miscStyles from '@/themes/globalStyles/miscStyles';
import { viteHandleReload } from '@/viteClient/viteReload';

/**
 * These identifiers may or may not have been set on the server, depending on whether the request
 * needs to be cache friendly (and hence may not be unique to this client + tab). Generate them now
 * if they are not set.
 */
function ensureIdentifiers() {
  if (!document.cookie.split('; ').find(row => row.startsWith(CLIENT_ID_COOKIE))) {
    // The API here is confusing but this is the correct way to set a single cookie (and it doesn't overwrite other cookies)
    document.cookie = `${CLIENT_ID_COOKIE}=${randomId()}; path=/; max-age=315360000`;
  }

  if (!window.tabId) {
    window.tabId = randomId();
  }
}
ensureIdentifiers();

let startupCalled = false;
async function clientStartup() {
  if (startupCalled) {
    return;
  }
  startupCalled = true;

  filterConsoleLogSpam();
  
  googleTagManagerInit();
  void initDatadog();
  void initReCaptcha();

  initAutoRefresh();
  rememberScrollPositionOnPageReload();
  initLegacyRoutes();
  hydrateClient();
  
  if (enableVite) {
    setTimeout(removeStaticStylesheet, 1000);
    viteHandleReload();
  }
}

// Starting up too early is known to compete for resources with rendering the page, causing the
// time to first meaningful paint to be delayed. This function waits until one frame has been rendered
// before starting up the client, which appears to fix the problem.
function startupAfterRendering() {
  // If for some reason the requestAnimationFrame functions don't fire (e.g. because
  // the tab is in the background), we still want to start the client reasonably quickly.
  setTimeout(() => clientStartup(), 500);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void clientStartup();
    });
  });
}

// Generally speaking, on fast internet connections the former condition will be true (bundle is fully
// downloaded before the page is ready), on slow connections the latter will be true
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startupAfterRendering);
} else {
  void startupAfterRendering();
}

/**
 * When using vite, we want component styles to be in individual <style> blocks
 * so that HMR can update them, but we also want the page to be visually
 * complete quickly after an SSR. So we include /allStyles, the merged
 * stylesheet that's used in production, and remove it after the individual
 * style nodes have been added to replace it.
 *
 * We have a few legacy styles that are in CSS rather than JSS, which are in
 * the merged stylesheet but not associated with any component, so we insert
 * them in its place.
 */
function removeStaticStylesheet() {
  const linkTags = document.getElementsByTagName("link")
  let insertedReplacementStyles = false;
  for (let i=0; i<linkTags.length; i++) {
    const linkTag = linkTags.item(i);
    if (linkTag) {
      const href = linkTag.getAttribute("href")
      if (href && href.startsWith("/allStyles")) {
        if (!insertedReplacementStyles) {
          insertedReplacementStyles = true;
          const miscStylesNode = document.createElement("style");
          miscStylesNode.append(document.createTextNode([
            miscStyles(),
          ].join("\n")));
          linkTag.parentElement!.insertBefore(miscStylesNode, linkTag);
        }
        linkTag.remove();
      }
    }
  }
}
