import { onStartup, isClient } from '../lib/executionEnvironment';
import { disconnectDdp, reconnectDdp } from '../lib/meteorDdp';
import { parsePath, parseRoute } from '../lib/vulcan-core/appContext';
import { Reload } from 'meteor/reload';

var disconnectTimer: any = null;

// 60 seconds by default
var disconnectTime = 60 * 1000;

onStartup(disconnectIfHidden);

document.addEventListener('visibilitychange', disconnectIfHidden);

function disconnectIfHidden() {
    removeDisconnectTimeout();

    if (document.hidden) {
      createDisconnectTimeout();
    } else {
      reconnectDdp();
    }
}

function createDisconnectTimeout() {
    removeDisconnectTimeout();

    disconnectTimer = setTimeout(function () {
        disconnectDdp();
    }, disconnectTime);
}

function removeDisconnectTimeout() {
    if (disconnectTimer) {
        clearTimeout(disconnectTimer);
    }
}

function shouldAutoRefresh() {
  const parsedUrl = parseRoute({
    location: parsePath(window.location.pathname),
  });
  if (!parsedUrl?.currentRoute)
    return true;
  return !parsedUrl.currentRoute.disableAutoRefresh;
}


if (isClient) {
  onStartup(() => {
    Reload._onMigrate((retry) => {
      // eslint-disable-next-line no-console
      console.log("New version available");
      if (shouldAutoRefresh()) {
        // eslint-disable-next-line no-console
        console.log("Refreshing to get new version");
        return [true, {}];
      } else {
        // eslint-disable-next-line no-console
        console.log("Not refreshing");
        return [false];
      }
    });
  });
}
