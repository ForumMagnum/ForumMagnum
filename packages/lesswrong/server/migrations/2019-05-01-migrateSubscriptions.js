import { newMutation } from 'meteor/vulcan:core';
import { registerMigration } from './migrationUtils';
import { forEachDocumentBatchInCollection } from '../queryUtil';
import Users from 'meteor/vulcan:users';
import { Comments } from '../../lib/collections/comments/collection.js';
import { Posts } from '../../lib/collections/posts/collection.js';
import { Subscriptions } from '../../lib/collections/subscriptions/collection.js';

registerMigration({
  name: "migrateSubscriptions",
  idempotent: true,
  action: async () => {
    forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 1000,
      callback: async (users) => {
        for (let user of users) {
          const oldSubscriptions = user.subscribedItems;
          const newSubscriptions = [];
          
          // Fetch subscribed posts and comments. A user's subscription to
          // their own post/comment doesn't count and is removed; a subscription
          // to someone else's post/comment is migrated to the Subscriptions
          // table.
          if (oldSubscriptions?.Comments) {
            const commentIDs = _.map(oldSubscriptions.Comments, s=>s.itemId);
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
              }
            }
          }
          if (oldSubscriptions?.Posts) {
            const postIDs = _.map(oldSubscriptions.Posts, s=>s.itemId);
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
            }
          }
          
          // Migrate subscriptions to other users
          if (oldSubscriptions?.Users) {
            for (let userSubscribedTo of oldSubscriptions.Users) {
              newSubscriptions.push({
                userId: user._id,
                state: "subscribed",
                documentId: userSubscribedTo._id,
                collectionName: "Users",
                type: "newPosts",
              });
            }
          }
          
          // Save the resulting subscriptions in the Subscriptions table
          if (newSubscriptions.length > 0) {
            Promise.all(_.map(newSubscriptions, async sub => {
              await newMutation({
                collection: Subscriptions,
                document: sub,
                context: {
                  currentUser: user
                },
                validate: false
              });
            }));
          }
          
          // Remove subscribedItems from the user
          if (oldSubscriptions) {
            await Users.update(
              { _id: user._id },
              { $unset: {
                subscribedItems: 1
              } }
            );
          }
        }
      }
    });
  },
});