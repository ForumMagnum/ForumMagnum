import { getSetting } from 'vulcan:lib';
const Intercom = require('intercom-client');
import './callbacks_async.js';

// Initiate Intercom on the server
const intercomToken = getSetting("intercomToken", null);
let intercomClient = null;
if (intercomToken) {
  intercomClient = new Intercom.Client({ token: intercomToken });
}

export default intercomClient;
