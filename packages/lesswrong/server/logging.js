import { getSetting, addCallback } from 'meteor/vulcan:core';
import timber from 'timber';

function initializeTimber() {
  const timberApiKey = getSetting('timber.apiKey', null);
  if (timberApiKey) {
    const transport = new timber.transports.HTTPS(timberApiKey);
    timber.install(transport);
  } else {
    //eslint-disable-next-line no-console
    console.warn("No Timber API key provided. Provide one if you want a better logging experience.")
  }
}

addCallback('graphql.init.before', initializeTimber)

// Log unhandled promise rejections, eg exceptions escaping from async
// callbacks. The default node behavior is to silently ignore these exceptions,
// which is terrible and has led to unnoticed bugs in the past.
process.on("unhandledRejection", r => {
  //eslint-disable-next-line no-console
  console.log(r);
  
  if (r.stack) {
    //eslint-disable-next-line no-console
    console.log(r.stack);
  }
});