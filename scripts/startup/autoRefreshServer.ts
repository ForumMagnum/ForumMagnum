// @ts-check
import WebSocket from 'ws';
import crypto from 'crypto';
import fs from 'fs';
import { getOutputDir } from './buildUtil';
import childProcess from 'child_process';
import { promisify } from 'util';

const openWebsocketConnections: WebSocket[] = [];
let clientRebuildInProgress = false;
let serverRebuildInProgress = false;

export function setClientRebuildInProgress(inProgress: boolean) {
  clientRebuildInProgress = inProgress;
}
export function setServerRebuildInProgress(inProgress: boolean) {
  serverRebuildInProgress = inProgress;
}

async function isServerReady(serverPort: number) {
  const readyApiUrl = `http://localhost:${serverPort}/api/ready`;
  try {
    const response = await fetch(readyApiUrl);
    return response.ok;
  } catch(e) {
    return false;
  }
}

async function waitForServerReady(serverPort: number) {
  while (!(await isServerReady(serverPort))) {
    await asyncSleep(100);
  }
}

async function asyncSleep(durationMs: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => resolve(), durationMs);
  });
}

function getClientBundleTimestamp() {
  const stats = fs.statSync(`./${getOutputDir()}/client/js/bundle.js`);
  return stats.mtime.toISOString();
}

function getServerBundleTimestamp() {
  const stats = fs.statSync(`./${getOutputDir()}/server/js/serverBundle.js`);
  return stats.mtime.toISOString();
}

// Returns the newer of the client bundle's timestamp, or the server bundle's
// timestamp.
function getEitherBundleTimestamp() {
  let clientBundleTimestamp = getClientBundleTimestamp();
  let serverBundleTimestamp = getServerBundleTimestamp();
  if (clientBundleTimestamp > serverBundleTimestamp)
    return clientBundleTimestamp;
  else
    return serverBundleTimestamp;
}

export function generateBuildId() {
  return crypto.randomBytes(12).toString('base64');
}

let refreshIsPending = false;
export async function initiateRefresh({serverPort}: {
  serverPort: number
}) {
  if (refreshIsPending || clientRebuildInProgress || serverRebuildInProgress) {
    return;
  }
  
  // Wait just long enough to make sure estrella has killed the old server
  // process so that when we check for server-readiness, we don't accidentally
  // check the process that's being replaced.
  await asyncSleep(100);
  
  refreshIsPending = true;
  await waitForServerReady(serverPort);
  
  if (openWebsocketConnections.length > 0) {
    console.log(`Notifying ${openWebsocketConnections.length} connected browser windows to refresh`);
    for (let connection of openWebsocketConnections) {
      connection.send(`{"latestBuildTimestamp": "${getEitherBundleTimestamp()}"}`);
    }
  } else {
    console.log("Not sending auto-refresh notifications (no connected browsers to notify)");
  }
  
  refreshIsPending = false;
}

export function startAutoRefreshServer({serverPort, websocketPort}: {
  serverPort: number
  websocketPort: number
}) {
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
    
    await waitForServerReady(serverPort);
    ws.send(`{"latestBuildTimestamp": "${getEitherBundleTimestamp()}"}`);
  });
}

const asyncExec = promisify(childProcess.exec);
let eslintIsRunning = false;

export async function startLint() {
  if (eslintIsRunning) {
    return;
  }

  eslintIsRunning = true;

  try {
    const eslintProcess = childProcess.spawn('yarn', ['--silent', 'eslint'], { stdio: 'inherit' });
    eslintProcess.on('close', () => {
      eslintIsRunning = false;
    });
  } catch(err) {
    console.error('Lint failed: ', err);
  }
}
