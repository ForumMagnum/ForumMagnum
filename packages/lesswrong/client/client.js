// Make sure to register settings before everything else
import '../lib/registerSettings.js'
// Then import the google analytics stuff
import './ga.js';
// Then import google reCaptcha v3
import './reCaptcha.js'

// Then do the rest
import './disconnect_meteor.js';
import './themeProvider.js';
import './logging.js';
import './votingFragmentMatcher.js';
export * from '../lib/index.js';

// Polyfills:
import 'element-closest'
