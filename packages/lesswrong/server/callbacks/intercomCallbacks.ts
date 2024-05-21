import { getIntercomClient } from '../intercomSetup';
import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("LWEvents").newAsync.add(async function sendIntercomEvent (event: DbLWEvent, user: DbUser) {
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
  let intercomEvent = {
    event_name: event.name ?? undefined,
    created_at: Math.floor((currentTime.getTime()/1000)),
    user_id: user._id,
    metadata: event.properties
  };
  await intercomClient.events.create(intercomEvent);
});
