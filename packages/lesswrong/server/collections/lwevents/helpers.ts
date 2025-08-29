import { getIntercomClient } from "@/server/intercomSetup";
import { AfterCreateCallbackProperties } from "@/server/mutationCallbacks";
import { updateSequenceReadStatusForPostRead } from "@/server/partiallyReadSequences";
import { captureException } from "@sentry/nextjs";

export async function updateReadStatus(event: Partial<DbInsertion<DbLWEvent>>, context: ResolverContext) {
  const { repos } = context;
  if (event.userId && event.documentId && event.name === "post-view") {
    // Upsert. This operation is subtle and fragile! We have a unique index on
    // (postId,userId,tagId). If two copies of a page-view event fire at the
    // same time, this creates a race condition. In order to not have this throw
    // an exception, we need to meet the conditions in
    //   https://docs.mongodb.com/manual/core/retryable-writes/#retryable-update-upsert
    // In particular, this means the selector has to exactly match the unique
    // index's keys.
    //
    // EDIT 2022-09-16: This is still the case in postgres ^
    const readStatus = await repos.readStatuses.upsertReadStatus(event.userId, event.documentId, true);
  }
  return event;
}

function userHasPartiallyReadSequence(user: DbUser, sequenceId: string): boolean {
  if (!user.partiallyReadSequences) {
    return false;
  }

  return user.partiallyReadSequences.some(s => s.sequenceId === sequenceId);
}

export async function updatePartiallyReadSequences(props: AfterCreateCallbackProperties<"LWEvents">) {
  const { document: event, context } = props;
  const { Users } = context;

  if (event.name === 'post-view' && event.properties.sequenceId) {
    const user = await Users.findOne({_id: event.userId});
    if (!user) return;
    const { sequenceId } = event.properties;
    
    // Don't add posts to the continue reading section just because a user reads
    // a post. But if the sequence is already there, update their position in
    // the sequence.
    if (userHasPartiallyReadSequence(user, sequenceId) && event.documentId) {
      // Deliberately lacks an await - this runs concurrently in the background
      await updateSequenceReadStatusForPostRead(user._id, event.documentId, event.properties.sequenceId, context);
    }
  }
}


export async function sendIntercomEvent(event: DbLWEvent, user: DbUser | null) {
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
}
