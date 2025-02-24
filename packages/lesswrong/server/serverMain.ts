import { startWebserver } from './apolloServer';
import { initGraphQL } from './vulcan-lib/apollo-server/initGraphQL';
import { createVoteableUnionType } from './votingGraphQL';
import { scheduleQueueProcessing } from './cache/swr';
import { initRenderQueueLogging } from './vulcan-lib/apollo-ssr/renderPage';
import { serverInitSentry, startMemoryUsageMonitor } from './logging';
import { initLegacyRoutes } from '@/lib/routes';
import { startupSanityChecks } from './startupSanityChecks';
import { addAllEditableCallbacks } from './editor/make_editable_callbacks';
import { refreshKarmaInflationCache } from './karmaInflation/cron';
import { initGoogleVertex } from './google-vertex/client';
import { addElicitResolvers } from './resolvers/elicitPredictions';
import { addLegacyRssRoutes } from './legacy-redirects/routes';
import { initReviewWinnerCache } from './resolvers/reviewWinnerResolvers';
import { startAnalyticsWriter } from './analyticsWriter';
import { startSyncedCron } from './cronUtil';
import { isAnyTest, isMigrations } from '@/lib/executionEnvironment';
import { Globals, Vulcan } from '@/lib/vulcan-lib/config';
import chokidar from 'chokidar';
import fs from 'fs';
import { basename, join } from 'path';
import { registerViewCronJobs } from './postgresView';
import { addCountOfReferenceCallbacks } from './callbacks/countOfReferenceCallbacks';
import { registerElasticCallbacks } from './search/elastic/elasticCallbacks';
import type { CommandLineArguments } from './commandLine';

/**
 * Entry point for the server, assuming it's a webserver (ie not cluster mode,
 * or is a worker process). By the time this is called, we should already be
 * connected to the database and have loaded settings from it.
 */
export const serverMain = async ({shellMode, command}: CommandLineArguments) => {
  await runServerOnStartupFunctions();

  if (shellMode) {
    initShell();
  } else if (command) {
    const func = compileWithGlobals(command);
    const result = await func();
    // eslint-disable-next-line no-console
    console.log("Finished. Result: ", result);
    process.kill(buildProcessPid, 'SIGQUIT');
  } else if (!isAnyTest && !isMigrations) {
    watchForShellCommands();
    startWebserver();
  }
}

export async function runServerOnStartupFunctions() {
  registerViewCronJobs();
  startAnalyticsWriter();
  scheduleQueueProcessing();
  initRenderQueueLogging();
  serverInitSentry();
  startMemoryUsageMonitor();
  initLegacyRoutes();
  await startupSanityChecks();
  addAllEditableCallbacks();
  await refreshKarmaInflationCache();
  initGoogleVertex();
  addElicitResolvers();
  addLegacyRssRoutes();
  await initReviewWinnerCache();
  addCountOfReferenceCallbacks();

  // define executableSchema
  createVoteableUnionType();
  initGraphQL();
  registerElasticCallbacks();

  startSyncedCron();
}


function initShell() {
  const repl = require('repl');
  /*const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });
  rl.on('line', line => {
    console.log(`Got input: ${line}`);
    rl.prompt();
  });
  rl.prompt();*/

  const r = repl.start({
    prompt: "> ",
    terminal: true,
    preview: true,
    breakEvalOnSigint: true,
    useGlobal: true,
  });
  r.context.Globals = Globals;
  r.context.Vulcan = Globals;
}

const compileWithGlobals = (code: string) => {
  // This is basically just eval() but done in a way that:
  //   (1) Allows us to define our own global scope
  //   (2) Doesn't upset esbuild
  const callable = (async function () {}).constructor(`with(this) { await ${code} }`);
  const scope = {Globals, Vulcan};
  return () => {
    return callable.call(new Proxy({}, {
      has () { return true; },
      get (_target, key) {
        if (typeof key !== "symbol") {
          return global[key as keyof Global] ?? scope[key as "Globals"|"Vulcan"];
        }
      }
    }));
  }
}

// Monitor ./tmp/pendingShellCommands for shell commands. If a JS file is
// written there, run it then delete it. Security-wise this is okay because
// write-access inside the repo directory is already equivalent to script
// execution.
const watchForShellCommands = () => {
  const watcher = chokidar.watch('./tmp/pendingShellCommands');
  watcher.on('add', async (path) => {
    const fileContents = fs.readFileSync(path, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Running shell command: ${fileContents}`);
    const newPath = join("tmp/runningShellCommands", basename(path));
    fs.renameSync(path, newPath);
    try {
      const func = compileWithGlobals(fileContents);
      const result = await func();
      // eslint-disable-next-line no-console
      console.log("Finished. Result: ", result);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log("Failed.");
      // eslint-disable-next-line no-console
      console.log(e);
    } finally {
      fs.unlinkSync(newPath);
    }
  });
}
