import { getSetting } from 'meteor/vulcan:lib';
import Intercom from 'intercom-client';

// Initiate Intercom on the server
const intercomToken = getSetting("intercomToken", null);
const intercomClient = intercomToken
  ? new Intercom.Client({ token: intercomToken })
  : null;

import './callbacks_async.js';


export default intercomClient;
