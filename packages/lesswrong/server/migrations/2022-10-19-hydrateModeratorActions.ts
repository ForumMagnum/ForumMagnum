import Users from "../../lib/collections/users/collection";
import { triggerAutomodIfNeededForUser } from "../callbacks/sunshineCallbackUtils";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";

// async function getAutomodIfNeededForUser(user: DbUser) {
//   const userId = user._id;

//   const automodActions: DbModeratorAction['type'][] = [];

//   const lowUserKarma = user.karma < -5;
//   if (lowUserKarma) automodActions.push(NEGATIVE_KARMA_USER_ALERT)

//   const [latestComments, latestPosts] = await Promise.all([
//     Comments.find({ userId }, { sort: { postedAt: -1 }, limit: 20 }).fetch(),
//     Posts.find({ userId }, { sort: { postedAt: -1 }, limit: 20 }).fetch()
//   ]);

//   const voteableContent = [...latestComments, ...latestPosts].sort((a, b) => b.postedAt.valueOf() - a.postedAt.valueOf());
  
//   // TODO: vary threshold based on other user info (i.e. age/karma/etc)?

//   const lowQualityComments = areRecentlyDownvotedComments(voteableContent);
//   const mediocreQualityComments = isLowAverageKarmaContent(latestComments, 'comment');
//   const mediocreQualityPosts = isLowAverageKarmaContent(latestPosts, 'post');

//   if (lowQualityComments) automodActions.push(RECENTLY_DOWNVOTED_CONTENT_ALERT);
//   if (mediocreQualityComments) automodActions.push(LOW_AVERAGE_KARMA_COMMENT_ALERT);
//   if (mediocreQualityPosts) automodActions.push(LOW_AVERAGE_KARMA_POST_ALERT);

//   return automodActions;
// }


registerMigration({
  name: "hydrateModeratorActions",
  dateWritten: "2022-10-19",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 1000,
      filter: { lastNotificationsCheck: { $gt: new Date('2022-01-01') } },
      callback: async (users) => {
        const userAutomodActions = await Promise.all(
          users.map(user => triggerAutomodIfNeededForUser(user)
        ));
      }
    });
  },
});
