import { onStartup } from '../lib/executionEnvironment';

// In development, make a websocket connection (on a different port) to get
// notified when the server has restarted with a new version.

const websocketPort = 3001;

function connectWebsocket() {
  // TODO
}

function disconnectWebsocket() {
  // TODO
}

if (!bundleIsProduction) {
  onStartup(() => {
    setTimeout(() => {
      connectWebsocket();
    }, 3000);
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        disconnectWebsocket();
      } else {
        connectWebsocket();
      }
    });
  });
}
