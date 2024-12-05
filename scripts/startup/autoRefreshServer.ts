// @ts-check
import WebSocket from 'ws';
import crypto from 'crypto';
import fs from 'fs';
import { getOutputDir, logWithTimestamp } from './buildUtil';
import childProcess from 'child_process';
import { promisify } from 'util';
import debounce from 'lodash/debounce';

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

export async function waitForServerReady(serverPort: number) {
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
  
  // Wait just long enough to make sure the old server process has shut down
  // so that when we check for server-readiness, we don't accidentally
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

let eslintIsRunning = false;
let tscIsRunning = false;
let eslintRestartRequested = false;
let tscRestartRequested = false;

/**
 * Start eslint and tsc to get type errors and warnings. We only want to run
 * one instance of each tool concurrently, but need to ensure that we
 * eventually run on a version that reflects the latest code changes; so, if
 * this is called and tsc or eslint is already running, we should note this fact so that
 * when it finishes we start running it again.
 */
async function _lintAndCheckTypes() {
  if (!eslintIsRunning) {
    runEslint();
  } else {
    eslintRestartRequested = true;
  }

  if (!tscIsRunning) {
    runTsc();
  } else {
    tscRestartRequested = true;
  }
}

/*
 * Debounce lintAndCheckTypes with a 2s delay. This has two functions: first,
 * it ensures that if a change causes the client and server bundles to both
 * rebuild, we only have to run tsc/esbuild once; and second, it prevents
 * tsc/eslint from starting up while esbuild is doing its extremely-parallel
 * compilation step and soaking up all available CPU.
 */
export const lintAndCheckTypes = debounce(_lintAndCheckTypes, 2000);

function runEslint() {
  eslintIsRunning = true;

  try {
    const eslintProcess = childProcess.spawn('yarn', ['--silent', 'eslint'], { stdio: 'inherit' });
    eslintProcess.on('close', () => {
      eslintIsRunning = false;
      if (eslintRestartRequested) {
        eslintRestartRequested = false;
        logWithTimestamp("Rerunning eslint (code changed while eslint was running)");
        runEslint();
      } else {
        logWithTimestamp("Finished eslint");
      }
    });
  } catch(err) {
    console.error('Lint failed: ', err);
    eslintIsRunning = false;
  }
}

function runTsc() {
  tscIsRunning = true;

  try {
    const tscProcess = childProcess.spawn('yarn', ['--silent', 'tsc'], { stdio: 'inherit' });
    tscProcess.on('close', () => {
      tscIsRunning = false;
      if (tscRestartRequested) {
        tscRestartRequested = false;
        logWithTimestamp("Rerunning tsc (code changed while tsc was running)");
        runTsc();
      } else {
        logWithTimestamp("Finished typechecking");
      }
    });
  } catch(err) {
    console.error('Type checking failed: ', err);
    tscIsRunning = false;
  }
}



