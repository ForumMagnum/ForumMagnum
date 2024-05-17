import '../client/publicSettings' // Must come first

// Imports required for this file:
import { runStartupFunctions } from '../lib/executionEnvironment';
import { filterConsoleLogSpam } from '../lib/consoleFilters';
import { DeferredComponentsTable, prepareComponent } from '../lib/vulcan-lib';
import { randomId } from '../lib/random';

// Imports required for the whole app:
import '../client';
import { CLIENT_ID_COOKIE } from '../lib/cookies/cookies';

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
  require('../deferred-client-scripts.js');
  await runStartupFunctions();
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

// While we are waiting for the main content to be downloaded, we can start importing all deferred components. "Importing"
// is a bit of a misnomer here, in that `prepareComponent` does some work to memoize and build higher order components.
// If components are not imported here, they will be imported when they are first used. Importing ahead of time speeds up
// the frontpage and post page hydration by about 25% (~100ms on an M1 mac).
//
// In the event that the main content is downloaded before all components are imported, we want to yield to the main thread
// to make sure all possible resources are available for rendering the page. The cases where this would occur are:
// 1. When the main content is served from the cache, in this case the below function doesn't even start importing
// 2. On a very slow CPU
const YIELD_MS = 25;
function importAllComponents() {
  const componentNames = Object.keys(DeferredComponentsTable);
  let index = 0;

  function importNextChunk(yieldMs: number | null = null) {
    const startTime = Date.now();

    while (index < componentNames.length && (!yieldMs || Date.now() - startTime < yieldMs)) {
      const componentName = componentNames[index];

      // window.ssrMetadata being present indicates that the main content has started being parsed.
      // Yield to the main thread and import all other components as an idle callback (will generally
      // run >1s later, after the main content has been rendered)
      if (yieldMs !== null && window.ssrMetadata) {
        requestIdleCallback(() => importNextChunk());
        return;
      }

      prepareComponent(componentName);
      index++;
    }

    if (index < componentNames.length) {
      setTimeout(() => importNextChunk(YIELD_MS), Math.floor(YIELD_MS / 2));
    }
  }

  importNextChunk(YIELD_MS);
}

// Generally speaking, on fast internet connections the former condition will be true (bundle is fully
// downloaded before the page is ready), on slow connections the latter will be true
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startupAfterRendering);
} else {
  void startupAfterRendering();
}

importAllComponents();
