console.log("Client.js")
import SimpleSchema from 'simpl-schema'
SimpleSchema.extendOptions([ 'foreignKey' ]);
// Make sure to register settings before everything else
import './lib/registerSettings.js'
// Then import the google analytics stuff
import './client/ga.js';
// Then import google reCaptcha v3
import './client/reCaptcha.js'

import './lib/index.js'

// Then do the rest
import './client/disconnect_meteor.js';
import './client/themeProvider';
import './client/logging.js';
import './client/votingFragmentMatcher.js';
export * from './lib/index.js';

// Polyfills:
import 'element-closest'
