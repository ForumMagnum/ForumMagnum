import * as esbuild from 'esbuild';
import process from 'process';
import { getDatabaseConfig, startSshTunnel, getOutputDir, setOutputDir, logWithTimestamp } from "./scripts/startup/buildUtil";
import { setClientRebuildInProgress, setServerRebuildInProgress, generateBuildId, startAutoRefreshServer, initiateRefresh, lintAndCheckTypes, waitForServerReady } from "./scripts/startup/autoRefreshServer";
import { spawn, ChildProcess } from 'child_process';
import { createServer as createViteServer, type ViteDevServer} from "vite";
import viteReact from "@vitejs/plugin-react";
import fs from 'fs';
import express from "express";
import bodyParser from 'body-parser';
// We explicitly need to override the native Node fetch implementation
// At least in Node 18, node's fetch relies on undici, which has a list of forbidden headers: https://github.com/nodejs/undici/issues/1470
// This causes it to break unless you have some other version of fetch installed in a way that overrides it globally
import fetch from 'node-fetch';
import ckeditor5Vite from '@ckeditor/vite-plugin-ckeditor5';


/**
 * This is used for clean exiting in Github workflows by the dev
 * only route /api/quit
 */
process.on("SIGQUIT", () => process.exit(0));

export type CommandLineOptions = {
  action: "build"|"watch"|"command"|"run"
  port: number|null
  production: boolean
  e2e: boolean
  codegen: boolean
  settings: string|null
  db: string|null
  postgresUrl: string|null
  postgresUrlFile: string|null
  shell: boolean
  command: string|null
  lint: boolean
  vite: boolean
  noSshTunnel: boolean
}
const defaultCommandLineOptions: CommandLineOptions = {
  action: "build",
  port: null,
  production: false,
  e2e: false,
  codegen: false,
  settings: null,
  db: null,
  postgresUrl: null,
  postgresUrlFile: null,
  shell: false,
  command: null,
  lint: false,
  vite: false,
  noSshTunnel: false,
}
const helpText = (argv0: string) => `usage: yarn ts-node build-esbuild.ts [options]`

function parseCommandLine(argv: string[]): [CommandLineOptions,string[]] {
  let result: CommandLineOptions = defaultCommandLineOptions
  let extraOpts: string[]  = [];
  for (let i=2; i<argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      extraOpts = [...extraOpts, ...argv.slice(i+1)];
      break;
    } else if (arg.startsWith("-")) {
      const argWithoutDashes = arg.startsWith("--") ? arg.substring(2) : arg.substring(1);
      switch(argWithoutDashes) {
        case "production":
          result.production = true;
          break;
        case "e2e":
          result.e2e = true;
          break;
        case "codegen":
          result.codegen = true;
          break;
        case "settings":
          result.settings = argv[++i];
          break;
        case "db":
          result.db = argv[++i];
          break;
        case "postgresUrl":
          result.postgresUrl = argv[++i];
          break;
        case "postgresUrlFile":
          result.postgresUrlFile = argv[++i];
          break;
        case "shell":
          result.shell = true;
          break;
        case "command":
          result.action = "command";
          result.command = argv[++i];
          break;
        case "lint":
          result.lint = true;
          break;
        case "build":
          result.action = "build";
          break;
        case "watch":
          result.action = "watch"
          break;
        case "run":
          result.action = "run"
          break;
        case "vite":
          result.vite = true;
          break;
        case "port":
          result.port = parseInt(argv[++i]);
          break;
        // Ignored arguments for Estrella back-compat
        case "quiet":
        case "silent":
        case "sourcemap":
        case "inline-sourcemap":
        case "no-color":
        case "no-clear":
        case "no-diag":
        case "color":
        case "diag":
          break;
        case "--no-ssh-tunnel":
          result.noSshTunnel = true;
          break;
      }
    } else {
      extraOpts.push(arg);
    }
  }
  
  return [result,extraOpts];
}

const [opts, args] = parseCommandLine(process.argv /*, [
  ["production", "Run in production mode"],
  ["e2e", "Run in end-to-end testing mode"],
  ["codegen", "Run in codegen mode"],
  ["settings", "A JSON config file for the server", "<file>"],
  ["db", "A path to a database connection config file", "<file>"],
  ["postgresUrl", "A postgresql connection connection string", "<url>"],
  ["postgresUrlFile", "The name of a text file which contains a postgresql URL for the database", "<file>"],
  ["shell", "Open an interactive shell instead of running a webserver"],
  ["command", "Run the given server shell command, then exit", "<string>"],
  ["lint", "Run the linter on site refresh"],
]*/)

const defaultServerPort = 3000;

function getServerPort (opts: CommandLineOptions) {
  if (opts.port) {
    return opts.port;
  } else if (opts.command) {
    return 5001;
  }
  const envPort = parseInt(process.env.PORT ?? "");
  if (!Number.isNaN(envPort)) return envPort;
  return defaultServerPort;
}

let latestCompletedBuildId: string|null = generateBuildId();
let inProgressBuildId: string|null = null;
const serverPort = getServerPort(opts);
const websocketPort = serverPort + 1;

setOutputDir(`./build${serverPort === defaultServerPort ? "" : serverPort}`);

const isProduction = !!opts.production;
const isE2E = !!opts.e2e;
const settingsFile = opts.settings || "settings.json"

// Allow FM_WATCH to override the --watch CLI flag that is passed in
/*const watchEnvVar = process.env.FM_WATCH?.toLowerCase();
if (watchEnvVar === 'true' || watchEnvVar === 'false') {
  cliopts.watch = watchEnvVar === 'true';
}*/

const databaseConfig = getDatabaseConfig(opts);
process.env.PG_URL = databaseConfig.postgresUrl;

if (databaseConfig.sshTunnelCommand) {
  startSshTunnel(databaseConfig.sshTunnelCommand);
}

if (isProduction) {
  process.env.NODE_ENV="production";
} else {
  process.env.NODE_ENV="development";
}

const clientBundleBanner = `/*
 * LessWrong 2.0 (client JS bundle)
 * Copyright (c) 2022 the LessWrong development team. See https://github.com/ForumMagnum/ForumMagnum
 * for source and license details.
 *
 * Includes CkEditor.
 * Copyright (c) 2003-2022, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see https://github.com/ckeditor/ckeditor5/blob/master/LICENSE.md
 */`

const bundleDefinitions: Record<string,string> = {
  "process.env.NODE_ENV": isProduction ? "\"production\"" : "\"development\"",
  "bundleIsProduction": `${isProduction}`,
  "bundleIsTest": "false",
  "bundleIsIntegrationTest": "false",
  "bundleIsCodegen": "false",
  "bundleIsE2E": `${isE2E}`,
  "bundleIsMigrations": "false",
  "defaultSiteAbsoluteUrl": `\"${process.env.ROOT_URL || ""}\"`,
  "buildId": `"${latestCompletedBuildId}"`,
  "ddEnv": `\"${process.env.DD_ENV || "local"}\"`,
  "enableVite": `${opts.vite}`,
};

const clientBundleDefinitions: Record<string,string> = {
  "bundleIsServer": "false",
  "global": "window",
}

const serverBundleDefinitions: Record<string,string> = {
  "bundleIsServer": "true",
  "buildProcessPid": `${process.pid}`,
}

/**
 * Managing a running server, and the restarting thereof. Takes a command
 * line invocation for starting the server, and a port number or list of
 * port numbers. If more than one port number is provided, will manage
 * overlapping servers, so that you can keep the old server running until its
 * replacement is ready for requests.
 */
type ServerSlotType = {
  port: number
  startedAt: Date|null
  status: "empty"|"starting"|"ready"|"exiting"
  process: ChildProcess|null
  pid: number|null
  inFlightRequestCount: number
  onDrain: (()=>void)|null
};
class RunningServer {
  private argv: string[];
  
  private serverSlots: Array<ServerSlotType>

  constructor(argv: string[], portOrPorts: number[]) {
    this.argv = argv;
    this.serverSlots = portOrPorts.map(port => ({
      port,
      startedAt: null,
      status: "empty",
      process: null,
      pid: null,
      inFlightRequestCount: 0,
      onDrain: null,
    }));
  }

  /**
   * If the server is already running, kill it (with SIGTERM). Then start the
   * server.
   */
  async startOrRestart(): Promise<void> {
    const slotToStartIn = this.selectSlotForServer();
    if (this.serverSlots[slotToStartIn].pid) {
      await this.killProcessInSlot(slotToStartIn, {drain: false});
    }
    this.startProcessInSlot(slotToStartIn);

    if (process.env.RESTART_INTERVAL) {
      const intervalSeconds = parseInt(process.env.RESTART_INTERVAL);
      const noise = Math.round(intervalSeconds * 0.1 * (Math.random() - 0.5) * 2);
      const intervalWithNoise = intervalSeconds + noise;
      console.log(`Scheduling restart in ${intervalWithNoise} seconds (original: ${intervalSeconds} seconds, noise: ${noise} seconds)`);
      // Note: This restart causes around 10s of downtime for this instance
      setTimeout(() => this.startOrRestart(), intervalWithNoise * 1000);
    }

  }
  
  private selectSlotForServer(): number {
    for (let targetStatus of ["empty", "exiting", "ready", "starting"]) {
      for (let i=0; i<this.serverSlots.length; i++) {
        const slot = this.serverSlots[i];
        if (slot.status === targetStatus) return i;
      }
    }
    return 0;
  }

  private startProcessInSlot(slotIndex: number): void {
    const [command, ...args] = this.argv;
    const port = this.serverSlots[slotIndex].port;

    logWithTimestamp(`Starting server on port ${port}`);
    const process = spawn(command, [...args, "--listen-port", port+""], {
      stdio: 'inherit',
      detached: false,
    });
    const slot: ServerSlotType = {
      port,
      startedAt: new Date(),
      status: "starting",
      process,
      pid: process.pid!,
      inFlightRequestCount: 0,
      onDrain: null,
    };
    this.serverSlots[slotIndex] = slot;
  
    process.on('error', (err) => {
      console.error('Failed to start subprocess.', err);
    });
  
    process.on('exit', (code, signal) => {
      logWithTimestamp(`Webserver process exited`);
      slot.status = "empty";
      slot.process = null;
      slot.pid = null;
    });
    
    waitForServerReady(port).then(() => {
      if (slot.status === "starting") {
        slot.status = "ready";
        this.killServersOtherThan(slotIndex);
      }
    });
  }
  
  private killServersOtherThan(slotIndex: number) {
    for (let i=0; i<this.serverSlots.length; i++) {
      if (slotIndex === i) continue;
      this.killProcessInSlot(i, {drain: true});
    }
  }

  private async killProcessInSlot(slotIndex: number, options?: {drain?: boolean}): Promise<void> {
    const slot = this.serverSlots[slotIndex];
    if (options?.drain) {
      await this.waitForRequestsToFinish(slot);
    }
    const process = slot.process;
    slot.status = "exiting";
    if (!process) {
      return;
    }
    logWithTimestamp(`Killing old server on port ${slot.port}`);

    return new Promise<void>((resolve) => {
      process.once('exit', () => {
        slot.status = "empty";
        slot.process = null;
        slot.pid = null;
        resolve();
      });
  
      process.kill('SIGTERM');
    });
  }
  
  private async waitForRequestsToFinish(slot: ServerSlotType): Promise<void> {
    if (!slot.inFlightRequestCount)
      return;

    logWithTimestamp(`Waiting for requests to drain from server on port ${slot.port}`);
    return new Promise((resolve) => {
      // Add an `onDrain` callback, which will get called by `requestFinished`.
      // If there's already one there, save it to be called in a chain. Also set
      // a timeout so that this triggers even if there's a stuck long request.
      let isResolved = false;
      const oldOnDrain = slot.onDrain
      function onFinish() {
        if (!isResolved) {
          isResolved = true;
          slot.onDrain = null;
          oldOnDrain?.();
          resolve();
        }
      }
      slot.onDrain = onFinish
      setTimeout(onFinish, 3000);
    });
  }
  
  getCurrentServer(): ServerSlotType|null {
    for (const serverSlot of this.serverSlots) {
      if (serverSlot.status === "ready") {
        return serverSlot;
      }
    }
    return null;
  }

  getPort(): number|null {
    return this.getCurrentServer()?.port ?? null;
  }
  
  requestStarted(slot: ServerSlotType) {
    slot.inFlightRequestCount++;
  }

  requestFinished(slot: ServerSlotType) {
    slot.inFlightRequestCount--;
    if (!slot.inFlightRequestCount) {
      slot.onDrain?.();
      slot.onDrain = null;
    }
  }
}

async function main() {
  const clientOutfilePath = `${getOutputDir()}/client/js/bundle.js`;
  const clientContext = await esbuild.context({
    entryPoints: ['./packages/lesswrong/client/clientStartup.ts'],
    tsconfig: "./tsconfig-client.json",
    bundle: true,
    target: "es2018",
    sourcemap: true,
    metafile: true,
    sourcesContent: true,
    outfile: clientOutfilePath,
    minify: isProduction,
    banner: {
      js: clientBundleBanner,
    },
    plugins: [{
      name: 'client-rebuild-notify',
      setup: (build) => {
        build.onStart(() => {
          logWithTimestamp("Client build started");
          setClientRebuildInProgress(true);
          inProgressBuildId = generateBuildId();
          if (opts.lint && !isProduction) {
            lintAndCheckTypes();
          }
        });
        build.onEnd((result) => {
          logWithTimestamp("Client build finished");
          setClientRebuildInProgress(false);
          if (result?.errors?.length > 0) {
            console.log("Skipping browser refresh notification because there were build errors");
          } else {
            latestCompletedBuildId = inProgressBuildId;
            if (opts.action === "watch" && !opts.vite) {
              initiateRefresh({serverPort});
            }
      
            if (result.metafile) {
              fs.writeFile(
                "client_meta.json",
                JSON.stringify(result.metafile, null, 2),
                () => {},
              );
            }
          }
          inProgressBuildId = null;
        });
      },
    }],
    define: {
      ...bundleDefinitions,
      ...clientBundleDefinitions,
    },
    external: [
      "cheerio"
    ],
  });
  
  let serverCli: string[] = [
    "node",
    ...(!isProduction ? ["--inspect"] : []),
    "--enable-source-maps",
    "--", `${getOutputDir()}/server/js/serverBundle.js`,
    "--settings", settingsFile,
    ...(opts.shell ? ["--shell"] : []),
    ...(opts.command ? ["--command", opts.command] : []),
  ]
  const serverProcess = opts.vite
    ? new RunningServer(serverCli, [serverPort+2, serverPort+4])
    : new RunningServer(serverCli, [serverPort]);
  
  const serverContext = await esbuild.context({
    entryPoints: ['./packages/lesswrong/server/runServer.ts'],
    tsconfig: "./tsconfig-server.json",
    bundle: true,
    outfile: `${getOutputDir()}/server/js/serverBundle.js`,
    platform: "node",
    sourcemap: true,
    sourcesContent: true,
    minify: false,
    plugins: [{
      name: 'server-rebuild-notify',
      setup: (build) => {
        build.onStart(() => {
          logWithTimestamp("Server build started");
          setServerRebuildInProgress(true);
          if (opts.lint && !isProduction) {
            lintAndCheckTypes();
          }
        });
        build.onEnd((result) => {
          logWithTimestamp("Server build finished");
          setServerRebuildInProgress(false);
          if (opts.action === "watch") {
            serverProcess.startOrRestart();
            if (!opts.vite) {
              initiateRefresh({serverPort});
            }
          }
        });
      },
    }],
    define: {
      ...bundleDefinitions,
      ...serverBundleDefinitions,
    },
    external: [
      "node_modules",
      "akismet-api", "canvas", "express", "mz", "pg", "pg-promise", "mathjax", "mathjax-node",
      "mathjax-node-page", "jsdom", "@sentry/node", "node-fetch", "later", "turndown",
      "@apollo/server", "graphql", "csso", "io-ts", "fp-ts",
      "bcrypt", "node-pre-gyp", "intercom-client", "node:*",
      "fsevents", "chokidar", "auth0", "dd-trace", "pg-formatter",
      "gpt-3-encoder", "@elastic/elasticsearch", "zod", "node-abort-controller",
      "cheerio", "vite", "@vitejs/plugin-react", "@google-cloud", "@aws-sdk",
      "@anthropic-ai/sdk", "openai", "@googlemaps"
    ],
  })
  
  if (opts.action === "watch" && !isProduction && !process.env.CI) {
    if (!opts.vite) {
      startAutoRefreshServer({serverPort, websocketPort});
    }
  }
  
  if (opts.vite) {
    serverContext.watch();
    // serverContext.rebuild();
    await createViteProxyServer(serverProcess);
  } else if (opts.action === "watch") {
    serverContext.watch();
    clientContext.watch();
  } else if (opts.action === "run") {
    await Promise.all([
      serverContext.rebuild(),
      clientContext.rebuild()
    ]);
    await esbuild.stop();
    serverProcess.startOrRestart();
  } else {
    await Promise.all([
      serverContext.rebuild(),
      clientContext.rebuild()
    ]);
    process.exit(0);
  }
}

async function createViteProxyServer(backend: RunningServer) {
  logWithTimestamp("Starting vite server");
  
  const app = express();
  const viteServer = await createViteServer({
    server: {
      middlewareMode: true
    },
    appType: "custom",
    configFile: false,
    plugins: [
      viteReact(),
      ckeditor5Vite({ theme: require.resolve( '@ckeditor/ckeditor5-theme-lark' ) })
    ],
    root: process.cwd(),
    define: {
      ...bundleDefinitions,
      ...clientBundleDefinitions,
      global: "globalThis",
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    clearScreen: false,
    resolve: {
      alias: {
        "@/server": "/packages/lesswrong/stubs/server",
        "@/client/importCkEditor": "/packages/lesswrong/viteClient/importCkEditorVite",
        "@/client": "/packages/lesswrong/client",
        "@/viteClient": "/packages/lesswrong/viteClient",
        "@/allComponents": "/packages/lesswrong/lib/generated/allComponents",
        "@": "/packages/lesswrong",
        
        // nodejs modules that aren't available on the client, which have
        // references from node_modules (postcss in particular) that cause
        // warnings
        // See: https://github.com/vitejs/vite/discussions/4479#discussioncomment-5205843
        ...(Object.fromEntries(["fs", "path", "source-map-js", "url"]
          .map(lib => [lib, "./packages/lesswrong/viteClient/stubMissingNodejsLibrary.ts"])))
      }
    },
  });
  app.use(bodyParser.raw({ type: '*/*', limit: '50mb' }));
  app.use(viteServer.middlewares);
  app.use('*', async (req, res) => {
    try {
      const originalUrl = new URL(req.originalUrl, "http://localhost:3000");
      const proxyTarget = "localhost";
      const backendServer = backend.getCurrentServer();
      if (!backendServer) {
        throw new Error("Backend server not ready yet");
      }
      try {
        const proxyPort = backendServer.port;
        backend.requestStarted(backendServer);
        const newUrl = new URL(originalUrl.pathname + originalUrl.search, `http://${proxyTarget}:${proxyPort}`);
    
        // Forward the request
        const response = await fetch(newUrl.toString(), {
          method: req.method,
          headers: {
            ...(req.headers as any),
          },
          body: (req.method !== 'GET' && req.method !== 'HEAD') ? req.body : undefined,
          redirect: 'manual',
        });
      
        // Send the response back to the client
        res.status(response.status);
        for (const [key, value] of Array.from(response.headers as any) as any) {
          res.setHeader(key, value);
        }
        const contentType = response.headers.get('content-type') ?? "";
        const responseText = await response.text();
        
        if (contentType.startsWith('text/html')) {
          res.send(
            responseText
            + await getViteProxiedSsrPageSuffix(viteServer, req.url)
          );
        } else {
          res.send(responseText);
        }
      } finally {
        backend.requestFinished(backendServer);
      }
    } catch(e) {
      console.error(e);
      logWithTimestamp(`Failed forwarding request for ${req.originalUrl}`);
      res.status(500);
      res.end(`${e.message}`);
    }
  });
  logWithTimestamp(`Vite listening on port ${serverPort}`);
  app.listen(serverPort);
}

async function getViteProxiedSsrPageSuffix(viteServer: ViteDevServer, url: string): Promise<string> {
  const viteHeader = await viteServer.transformIndexHtml(url, "<!--app-head-->");
  return viteHeader
    + '<script type="module" src="/packages/lesswrong/client/clientStartup.ts"></script>'
}

main();
