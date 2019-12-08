// Make sure to register settings before everything else
import '../imports/lib/registerSettings.js'
// Then import the google analytics stuff
import '../imports/client/ga.js';
// Then import google reCaptcha v3
import '../imports/client/reCaptcha.js'

// Then do the rest
import '../imports/client/disconnect_meteor.js';
import '../imports/client/themeProvider.js';
import '../imports/client/logging.js';
import '../imports/client/votingFragmentMatcher.js';
export * from '../imports/lib/index.js';

// Polyfills:
import 'element-closest'
