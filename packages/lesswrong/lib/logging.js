import { getSetting, addCallback } from 'meteor/vulcan:core';
import timber from 'timber';

function initializeTimber() {
  getSetting('timber.apiKey');
  const transport = new timber.transports.HTTPS(getSetting('timber.apiKey'));
  timber.install(transport);
}

addCallback('graphql.init.before', initializeTimber)
