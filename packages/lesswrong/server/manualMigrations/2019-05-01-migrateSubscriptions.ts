import { forEachDocumentBatchInCollection, registerMigration } from './migrationUtils';
import Users from '../../server/collections/users/collection';
import { Comments } from '../../server/collections/comments/collection';
import { Posts } from '../../server/collections/posts/collection';
import { createSubscription } from '../collections/subscriptions/mutations';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';

export default registerMigration({
  name: "migrateSubscriptions",
  dateWritten: "2019-05-01",
  idempotent: true,
  action: async () => {
    let numCommentSubscriptions = 0;
    let numPostSubscriptions = 0;
    let numGroupSubscriptions = 0;
    let numUserSubscriptions = 0;
    let numTotalSubscriptions = 0;
    
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 1000,
      callback: async (users: DbUser[]) => {
        for (let user of users) {
          const oldSubscriptions = (user as any).subscribedItems;
          const newSubscriptions: Array<any> = [];
          
          // Fetch subscribed posts and comments. A user's subscription to
          // their own post/comment doesn't count and is removed; a subscription
          // to someone else's post/comment is migrated to the Subscriptions
          // table.
          if (oldSubscriptions?.Comments) {
            const commentIDs = oldSubscriptions.Comments.map((s: any)=>s.itemId);
            const comments = await Comments.find({_id: {$in: commentIDs}}).fetch();
            for (let comment of comments) {
              if (comment.userId !== user._id) {
                newSubscriptions.push({
                  userId: user._id,
                  state: "subscribed",
                  documentId: comment._id,
                  collectionName: "Comments",
                  type: "newReplies",
                });
                numCommentSubscriptions++;
              }
            }
          }
          if (oldSubscriptions?.Posts) {
            const postIDs = oldSubscriptions.Posts.map((s: any)=>s.itemId);
            const posts = await Posts.find({_id: {$in: postIDs}}).fetch();
            for (let post of posts) {
              if (post.userId !== user._id) {
                newSubscriptions.push({
                  userId: user._id,
                  state: "subscribed",
                  documentId: post._id,
                  collectionName: "Posts",
                  type: "newComments",
                });
                numPostSubscriptions++;
              }
            }
          }
          
          // Migrate subscriptions to groups
          if (oldSubscriptions?.Localgroups) {
            for (let group of oldSubscriptions.Localgroups) {
              newSubscriptions.push({
                userId: user._id,
                state: "subscribed",
                documentId: group._id,
                collectionName: "Localgroups",
                type: "newEvents",
              });
              numGroupSubscriptions++;
            }
          }
          
          // Migrate subscriptions to other users
          if (oldSubscriptions?.Users) {
            for (let userSubscribedTo of oldSubscriptions.Users) {
              newSubscriptions.push({
                userId: user._id,
                state: "subscribed",
                documentId: userSubscribedTo.itemId,
                collectionName: "Users",
                type: "newPosts",
              });
              numUserSubscriptions++;
            }
          }
          
          // Save the resulting subscriptions in the Subscriptions table
          if (newSubscriptions.length > 0) {
            numTotalSubscriptions += newSubscriptions.length;
            await Promise.all(newSubscriptions.map(async sub => {
              await createSubscription({ data: sub }, await computeContextFromUser({ user, isSSR: false }));
            }));
          }
          
          // Remove subscribedItems from the user
          if (oldSubscriptions) {
            await Users.rawUpdateOne(
              { _id: user._id },
              { $unset: {
                subscribedItems: 1
              } }
            );
          }
        }
    
        // eslint-disable-next-line no-console
        console.log(`Migrated batch of ${users.length} users. Cumulative updates: ${numCommentSubscriptions} comment subscriptions, ${numPostSubscriptions} post subscriptions, ${numGroupSubscriptions} group subscriptions, ${numUserSubscriptions} user subscriptions (${numTotalSubscriptions} total)`);
      }
    });
  },
});
