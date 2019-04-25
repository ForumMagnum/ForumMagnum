// Make sure to register settings before everything else
import './lib/registerSettings.js'
// Then import the google analytics stuff
import './client/ga.js';

// Then do the rest
import './client/disconnect_meteor.js';
import './client/themeProvider.js';
import './client/logging.js';
import './client/votingFragmentMatcher.js';
export * from './lib/index.js';

// Polyfills:
import 'element-closest'
