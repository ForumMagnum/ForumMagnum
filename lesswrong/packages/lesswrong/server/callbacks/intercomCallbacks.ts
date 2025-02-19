import { captureException } from '@sentry/core';
import { getIntercomClient } from '../intercomSetup';
import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("LWEvents").newAsync.add(async function sendIntercomEvent (event: DbLWEvent, user: DbUser) {
  try {
    const intercomClient = getIntercomClient();
    if (!intercomClient) {
      return;
    }
    if (!user || !event?.intercom) {
      return;
    }
    // Append documentId to metadata passed to intercom
    event.properties = {
      ...event.properties,
      documentId: event.documentId,
    }
    let currentTime = new Date();
    await intercomClient.events.create({
      eventName: event.name ?? "",
      createdAt: Math.floor((currentTime.getTime()/1000)),
      userId: user._id,
      metadata: event.properties
    });
  } catch(e) {
    // `intercomClient.events.create` involves a request to Intercom's servers,
    // which can fail. We had an issue where the request to Intercom's server
    // would fail with a 401 (unauthorized), the exception would bubble out of
    // this callback, and an LW user's request to `/graphql`, containing a
    // page-view event and also some requests for data, would return that 401.
    // This would cause the user to see a spurious login prompt, and also the
    // request itself would fail.
    captureException(e);
  }
});
