import { getSetting } from 'meteor/vulcan:lib';
import Intercom from 'intercom-client';

// Initiate Intercom on the server
var intercomClient = new Intercom.Client({ token: getSetting("intercomToken") });


import './callbacks_async.js';


export default intercomClient
