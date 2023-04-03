import 'regenerator-runtime/runtime';
import { filterConsoleLogSpam } from '../lib/consoleFilters';

process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";

filterConsoleLogSpam();
