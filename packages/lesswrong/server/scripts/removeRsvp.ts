import { Posts } from "../../lib/collections/posts/collection";

// Exported to allow running manually with "yarn repl"
export const removeRsvp = async (eventId: string, userNameOrId: string) => {
  const event = await Posts.findOne({_id: eventId});
  if (!event) {
    throw new Error("Event does not exist");
  }

  const {rsvps} = event;
  if (!Array.isArray(rsvps)) {
    throw new Error("Event has no RSVPs");
  }

  const newRsvps = rsvps.filter(
    (rsvp) => rsvp.userId !== userNameOrId && rsvp.name !== userNameOrId,
  );
  if (newRsvps.length !== rsvps.length - 1) {
    throw new Error("Error filtering out user id from rsvp list");
  }

  await Posts.rawUpdateOne(
    {_id: eventId},
    {$set: {rsvps: newRsvps}},
  );
}
