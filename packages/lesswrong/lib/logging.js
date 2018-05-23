import { getSetting, addCallback } from 'meteor/vulcan:core';
import timber from 'timber';

function initializeTimber() {
  const timberApiKey = getSetting('timber.apiKey', null);
  if (timberApiKey) {
    const transport = new timber.transports.HTTPS(timberApiKey);
    timber.install(transport);
  } else {
    console.warn("No Timber API key provided. Provide one if you want a better logging experience.")
  }
}

addCallback('graphql.init.before', initializeTimber)
