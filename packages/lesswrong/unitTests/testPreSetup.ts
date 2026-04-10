import 'regenerator-runtime/runtime';
import { filterConsoleLogSpam } from '../lib/consoleFilters';
import { disableFragmentWarnings } from 'graphql-tag';

filterConsoleLogSpam();
disableFragmentWarnings();


// Workaround for TextEncoder being missing from the environment that jest
// sets up for unit tests, which causes a crash on import of pg-promise.
import { TextEncoder } from 'util';
Object.assign(global, { TextEncoder });
