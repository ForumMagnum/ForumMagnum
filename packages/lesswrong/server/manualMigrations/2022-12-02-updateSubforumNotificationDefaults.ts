/* eslint-disable no-console */
import { registerMigration, forEachDocumentBatchInCollection } from "./migrationUtils";
import Users from "../../lib/collections/users/collection";
import Tags from "../../lib/collections/tags/collection";
import { Subscriptions } from "../../lib/collections/subscriptions/collection";
import { randomId } from "../../lib/random";

registerMigration({
  name: "updateSubforumNotificationDefaults",
  dateWritten: "2022-12-02",
  idempotent: true,
  action: async () => {
    // Update the default notification settings for "threads" to be onsite, daily, and not muted
    console.log("Updating default notification settings for subforum threads")
    let usersUpdated = 0
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 1000,
      filter: {
        // These were the previous defaults. If they have not changed them, update to the new defaults
        "notificationSubforumUnread.channel": "email",
        "notificationSubforumUnread.batchingFrequency": "daily",
      },
      callback: async (users) => {
        await Users.rawUpdateMany({_id: {$in: users.map(u=>u._id)}}, {$set: {
          "notificationSubforumUnread.channel": "onsite",
        }})
        usersUpdated += users.length
        console.log(`Updated ${usersUpdated} users`)
      }
    });
    
    // Update the default notification settings for posts to be not muted, keep whatever batching/channel the user had (which is onsite, realtime by default)
    // If the user has changed this manually in the past, there will be a Subscriptions document with `state` as "subscribed" or "suppressed". Ignore
    // those, and only create a new Subscriptions object for users that don't have one already.
    console.log("Updating default notification settings for subforum posts")
    const subforumTags = await Tags.find({isSubforum: true}).fetch()
    
    for (const tag of subforumTags) {
      console.log(`Updating post notification settings for subforum ${tag.slug}`)
      const subforumMembers = await Users.find({profileTagIds: tag._id}).fetch();
      const subscribedSubforumMembers = await Subscriptions.find({userId:  {$in: subforumMembers.map(u=>u._id)}, documentId: tag._id, collectionName: "Tags", type: "newTagPosts", deleted: false}).fetch();
      const unsubscribedSubforumMembers = subforumMembers.filter(u => !subscribedSubforumMembers.find(s => s.userId === u._id));
      
      const newSubscriptions = unsubscribedSubforumMembers.map(u => ({
        insertOne: {
          document: {
            _id: randomId(),
            userId: u._id,
            collectionName: "Tags",
            documentId: tag._id,
            type: "newTagPosts",
            state: "subscribed",
            deleted: false,
            createdAt: new Date(),
            schemaVersion: 1,
            legacyData: null
          } as const
        }
      }))

      console.log(`Creating ${newSubscriptions.length} new subscriptions`)
      if (newSubscriptions.length) {
        await Subscriptions.rawCollection().bulkWrite(newSubscriptions);
      }
    }
  }
});
