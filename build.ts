import * as esbuild from 'esbuild';
import process from 'process';
import { getDatabaseConfig, startSshTunnel, getOutputDir, setOutputDir, logWithTimestamp } from "./scripts/startup/buildUtil";
import { setClientRebuildInProgress, setServerRebuildInProgress, generateBuildId, startAutoRefreshServer, initiateRefresh, lintAndCheckTypes } from "./scripts/startup/autoRefreshServer";
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';


/**
 * This is used for clean exiting in Github workflows by the dev
 * only route /api/quit
 */
process.on("SIGQUIT", () => process.exit(0));

export type CommandLineOptions = {
  action: "build"|"watch"|"command"
  production: boolean
  e2e: boolean
  settings: string|null
  db: string|null
  postgresUrl: string|null
  postgresUrlFile: string|null
  shell: boolean
  command: string|null
  lint: boolean
}
const defaultCommandLineOptions: CommandLineOptions = {
  action: "build",
  production: false,
  e2e: false,
  settings: null,
  db: null,
  postgresUrl: null,
  postgresUrlFile: null,
  shell: false,
  command: null,
  lint: false,
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
        case "run":
          result.action = "watch"
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
  ["settings", "A JSON config file for the server", "<file>"],
  ["db", "A path to a database connection config file", "<file>"],
  ["postgresUrl", "A postgresql connection connection string", "<url>"],
  ["postgresUrlFile", "The name of a text file which contains a postgresql URL for the database", "<file>"],
  ["shell", "Open an interactive shell instead of running a webserver"],
  ["command", "Run the given server shell command, then exit", "<string>"],
  ["lint", "Run the linter on site refresh"],
]*/)


const defaultServerPort = 3000;

const getServerPort = () => {
  if (opts.command) {
    return 5001;
  }
  const port = parseInt(process.env.PORT ?? "");
  return Number.isNaN(port) ? defaultServerPort : port;
}

let latestCompletedBuildId: string|null = generateBuildId();
let inProgressBuildId: string|null = null;
const serverPort = getServerPort();
const websocketPort = serverPort + 1;

setOutputDir(`./build${serverPort === defaultServerPort ? "" : serverPort}`);

// Two things this script should do, that it currently doesn't:
//  * Provide a websocket server for signaling autorefresh

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
  "bundleIsE2E": `${isE2E}`,
  "bundleIsMigrations": "false",
  "defaultSiteAbsoluteUrl": `\"${process.env.ROOT_URL || ""}\"`,
  "buildId": `"${latestCompletedBuildId}"`,
  "serverPort": `${getServerPort()}`,
  "ddEnv": `\"${process.env.DD_ENV || "local"}\"`,
};

const clientBundleDefinitions: Record<string,string> = {
  "bundleIsServer": "false",
  "global": "window",
}

const serverBundleDefinitions: Record<string,string> = {
  "bundleIsServer": "true",
  "estrellaPid": `${process.pid}`,
}

class RunningServer {
  private argv: string[];
  private pid: number | null = null;
  private process: ChildProcess | null = null;

  constructor(argv: string[]) {
    this.argv = argv;
  }

  /**
   * If the server is already running, kill it (with SIGTERM). Then start the
   * server.
   */
  async startOrRestart(): Promise<void> {
    if (this.process) {
      await this.killProcess();
    }
    this.startProcess();
  }

  private startProcess(): void {
    const [command, ...args] = this.argv;
    this.process = spawn(command, args, {
      stdio: 'inherit',
      detached: false,
    });
  
    this.pid = this.process.pid ?? null;
  
    this.process.on('error', (err) => {
      console.error('Failed to start subprocess.', err);
    });
  
    this.process.on('exit', (code, signal) => {
      logWithTimestamp(`Webserver process exited`);
      this.process = null;
      this.pid = null;
    });
  }

  private killProcess(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }
  
      this.process.once('exit', () => {
        this.process = null;
        this.pid = null;
        resolve();
      });
  
      this.process.kill('SIGTERM');
    });
  }
}

async function main() {
  const clientOutfilePath = `${getOutputDir()}/client/js/bundle.js`;
  const clientContext = await esbuild.context({
    entryPoints: ['./packages/lesswrong/client/clientStartup.ts'],
    bundle: true,
    target: "es6",
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
          if (opts.lint) {
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
            if (opts.action === "watch") {
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
      "cheerio",
    ],
  });
  
  let serverCli: string[] = [
    "node",
    ...(!isProduction ? ["--inspect"] : []),
    "-r", "source-map-support/register",
    "--", `${getOutputDir()}/server/js/serverBundle.js`,
    "--settings", settingsFile,
    ...(opts.shell ? ["--shell"] : []),
    ...(opts.command ? ["--command", opts.command] : []),
  ]
  const serverProcess = new RunningServer(serverCli);
  
  const serverContext = await esbuild.context({
    entryPoints: ['./packages/lesswrong/server/runServer.ts'],
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
          if (opts.lint) {
            lintAndCheckTypes();
          }
        });
        build.onEnd((result) => {
          logWithTimestamp("Server build finished");
          setServerRebuildInProgress(false);
          if (opts.action === "watch") {
            serverProcess.startOrRestart();
            initiateRefresh({serverPort});
          }
        });
      },
    }],
    // FIXME This was an Estrella option for controlling whether Typescript typechecking
    // is done. This functionality is currently orphaned (typescript errors don't get shown
    // in the server console)
    //tslint: !isProduction,
    define: {
      ...bundleDefinitions,
      ...serverBundleDefinitions,
    },
    external: [
      "node_modules",
      "akismet-api", "canvas", "express", "mz", "pg", "pg-promise", "mathjax", "mathjax-node",
      "mathjax-node-page", "jsdom", "@sentry/node", "node-fetch", "later", "turndown",
      "apollo-server", "apollo-server-express", "graphql", "csso", "io-ts", "fp-ts",
      "bcrypt", "node-pre-gyp", "intercom-client", "node:*",
      "fsevents", "chokidar", "auth0", "dd-trace", "pg-formatter",
      "gpt-3-encoder", "@elastic/elasticsearch", "zod", "node-abort-controller",
      "cheerio"
    ],
  })
  
  if (opts.action === "watch" && !isProduction && !process.env.CI) {
    startAutoRefreshServer({serverPort, websocketPort});
  }
  
  if (opts.action === "watch") {
    serverContext.watch();
    clientContext.watch();
  } else {
    await Promise.all([
      serverContext.rebuild(),
      clientContext.rebuild()
    ]);
    process.exit(0);
  }
}

main();
