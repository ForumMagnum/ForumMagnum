import 'regenerator-runtime/runtime';
import { filterConsoleLogSpam } from '../lib/consoleFilters';
import { AbortSignal } from "node-abort-controller";

function ensurePgUrlIsTemporaryTestServer(): void {
  if (!process.env.PG_URL?.includes("@127.0.0.1:")) {
    throw new Error("Refusing to run integration tests: PG_URL isn't the temporary local database that globalSetup starts");
  }
}

// Fix for Reference error AbortSignal in `lru-cache`
// See https://github.com/isaacs/node-lru-cache/issues/239
global.AbortSignal = AbortSignal as AnyBecauseHard;

process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";

ensurePgUrlIsTemporaryTestServer();

filterConsoleLogSpam();
