import 'regenerator-runtime/runtime';
import { filterConsoleLogSpam } from '../lib/consoleFilters';
import { AbortSignal } from "node-abort-controller";

// Fix for Reference error AbortSignal in `lru-cache`
// See https://github.com/isaacs/node-lru-cache/issues/239
global.AbortSignal = AbortSignal as AnyBecauseHard;

process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";

filterConsoleLogSpam();
