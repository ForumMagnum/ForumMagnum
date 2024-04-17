import { runStartupFunctions } from '../lib/executionEnvironment';
import { filterConsoleLogSpam } from '../lib/consoleFilters';

import './apolloClient';
import '../lib/vulcan-lib';
import '../client/start';

// Make sure to register settings before everything else
import '../client/publicSettings'

import '../client/autoRefresh';
import '../client/scrollRestoration';
import '../client/clickableCheckboxLabels';
import '../client/themeProvider';
import '../client/logging';
import '../lib/index';

// Polyfills:
import 'element-closest'

let startupCalled = false;

async function clientStartup() {
  if (startupCalled) {
    return;
  }
  startupCalled = true;

  filterConsoleLogSpam();
  require('../client.js');
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

// Generally speaking, on fast internet connections the former condition will be true (bundle is fully
// downloaded before the page is ready), on slow connections the latter will be true
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startupAfterRendering);
} else {
  void startupAfterRendering();
}
