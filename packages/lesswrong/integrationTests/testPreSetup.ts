import 'regenerator-runtime/runtime';
import { filterConsoleLogSpam } from '../lib/consoleFilters';
import { AbortSignal } from "node-abort-controller";
// See https://github.com/openai/openai-node#customizing-the-fetch-client
// eslint-disable-next-line no-restricted-imports
import "openai/shims/node";

const DEFAULT_LOCAL_TEST_PG_URL = "postgres://postgres:password@localhost:5433/postgres";

function ensureLocalPgUrlForIntegrationTests(): void {
  // CI is expected to explicitly provide PG_URL (typically a service container).
  if (process.env.CI) return;

  if (!process.env.PG_URL) {
    // Default to the standard local docker instance (same as our playwright-db).
    process.env.PG_URL = DEFAULT_LOCAL_TEST_PG_URL;
  }

  const pgUrl = process.env.PG_URL;
  const allowRemote = process.env.ALLOW_REMOTE_TEST_DB === "1";
  if (!allowRemote && pgUrl && !/(localhost|127\.0\.0\.1)/.test(pgUrl)) {
    throw new Error(
      `Refusing to run integration tests against non-local PG_URL.\n` +
        `PG_URL=${pgUrl}\n` +
        `Set PG_URL=${DEFAULT_LOCAL_TEST_PG_URL} (start docker with \`yarn integration-db-up\`),\n` +
        `or set ALLOW_REMOTE_TEST_DB=1 to override (not recommended).`,
    );
  }
}

// Fix for Reference error AbortSignal in `lru-cache`
// See https://github.com/isaacs/node-lru-cache/issues/239
global.AbortSignal = AbortSignal as AnyBecauseHard;

process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";

ensureLocalPgUrlForIntegrationTests();

filterConsoleLogSpam();
