import type { MessageEvent, CloseEvent } from 'ws';
import { getCommandLineArguments } from '@/server/commandLine';

// In development, make a websocket connection (on a different port) to get
// notified when the server has restarted with a new version.

let connectedWebsocket: any = null;
let buildTimestamp: string|null = null;

function connectWebsocket() {
  if (connectedWebsocket) return;
  
  const websocketPort = getCommandLineArguments().localhostUrlPort + 1;
  connectedWebsocket = new WebSocket(`ws://localhost:${websocketPort}`);

  connectedWebsocket.addEventListener("message", (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data+"");
      if (data.latestBuildTimestamp) {
        if (!buildTimestamp) {
          buildTimestamp = data.latestBuildTimestamp;
        } else if (data.latestBuildTimestamp !== buildTimestamp) {
          refreshForNewVersion(data.latestBuildTimestamp);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error("Websocket message is unrecognized");
      }
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error("Got invalid message on websocket", e);
      // eslint-disable-next-line no-console
      console.log(e);
    }
  });
  connectedWebsocket.addEventListener("open", (event: AnyBecauseObsolete) => {
  });
  connectedWebsocket.addEventListener("error", (event: CloseEvent) => {
    disconnectWebsocket();
  });
  connectedWebsocket.addEventListener("close", (event: CloseEvent) => {
    disconnectWebsocket();
  });
}

let reloadStarted = false;
function refreshForNewVersion(newVersionTimestamp: string) {
  if (!reloadStarted) {
    reloadStarted = true;
    // eslint-disable-next-line no-console
    console.log(`There is a newer build (my build: ${buildTimestamp}; new build: ${newVersionTimestamp}). Refreshing.`);
    window.location.reload();
  }
}

function disconnectWebsocket() {
  if (connectedWebsocket) {
    connectedWebsocket.close();
    connectedWebsocket = null;
  }
}

export function initAutoRefresh() {
  if (!bundleIsProduction && !enableVite) {
    setTimeout(() => {
      connectWebsocket();
      
      setInterval(() => {
        try {
          connectWebsocket();
        // eslint-disable-next-line no-empty
        } catch {
          // Deliberately swallow connection-failed errors from the auto-refresh
          // notification websocket, since the server might not actually be running.
          // Unfortunately this doesn't get rid of all the browser-console spam,
          // but it gets rid of some.
        }
      }, 5000);
    }, 3000);
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        disconnectWebsocket();
      } else {
        connectWebsocket();
      }
    });
  }
}
