const WebSocket = require('ws');
const crypto = require('crypto');

const openWebsocketConnections = [];
let clientRebuildInProgress = false;
let serverRebuildInProgress = false;

function setClientRebuildInProgress(inProgress) {
  clientRebuildInProgress = inProgress;
}
function setServerRebuildInProgress(inProgress) {
  serverRebuildInProgress = inProgress;
}

async function isServerReady() {
  try {
    const response = await fetch(`http://localhost:${serverPort}/api/ready`);
    return response.ok;
  } catch(e) {
    return false;
  }
}

async function waitForServerReady() {
  while (!(await isServerReady())) {
    await asyncSleep(100);
  }
}

async function asyncSleep(durationMs) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), durationMs);
  });
}

function getClientBundleTimestamp() {
  const stats = fs.statSync(`./${outputDir}/client/js/bundle.js`);
  return stats.mtime.toISOString();
}

function generateBuildId() {
  return crypto.randomBytes(12).toString('base64');
}

let refreshIsPending = false;
async function initiateRefresh() {
  if (refreshIsPending || clientRebuildInProgress || serverRebuildInProgress) {
    return;
  }
  
  // Wait just long enough to make sure estrella has killed the old server
  // process so that when we check for server-readiness, we don't accidentally
  // check the process that's being replaced.
  await asyncSleep(100);
  
  refreshIsPending = true;
  console.log("Initiated refresh; waiting for server to be ready");
  await waitForServerReady();
  
  if (openWebsocketConnections.length > 0) {
    console.log(`Notifying ${openWebsocketConnections.length} connected browser windows to refresh`);
    for (let connection of openWebsocketConnections) {
      connection.send(`{"latestBuildTimestamp": "${getClientBundleTimestamp()}"}`);
    }
  } else {
    console.log("Not sending auto-refresh notifications (no connected browsers to notify)");
  }
  
  refreshIsPending = false;
}

function startAutoRefreshServer(websocketPort) {
  const server = new WebSocket.Server({
    port: websocketPort,
  });
  server.on('connection', async (ws) => {
    openWebsocketConnections.push(ws);
    
    ws.on('message', (data) => {
    });
    ws.on('close', function close() {
      const connectionIndex = openWebsocketConnections.indexOf(ws);
      if (connectionIndex >= 0) {
        openWebsocketConnections.splice(connectionIndex, 1);
      }
    });
    
    await waitForServerReady();
    ws.send(`{"latestBuildTimestamp": "${getClientBundleTimestamp()}"}`);
  });
}

module.exports = { setClientRebuildInProgress, setServerRebuildInProgress, generateBuildId, startAutoRefreshServer, initiateRefresh };
