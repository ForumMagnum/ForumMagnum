import './client/disconnect_meteor.js';
import './client/themeProvider.js';
import './client/logging.js';
import './client/votingFragmentMatcher.js';
export * from './lib/index.js';

// After this line we can guarantee that registerSettings has been called
import './client/ga.js';
// Polyfills:
import 'element-closest'
