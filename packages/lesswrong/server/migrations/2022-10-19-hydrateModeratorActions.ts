import { registerMigration, forEachDocumentBatchInCollection } from "./migrationUtils";
import Users from "../../lib/collections/users/collection";
import { LOW_AVERAGE_KARMA_COMMENT_ALERT, LOW_AVERAGE_KARMA_POST_ALERT, NEGATIVE_KARMA_USER_ALERT, RECENTLY_DOWNVOTED_CONTENT_ALERT } from "../../lib/collections/moderatorActions/schema";
import Comments from "../../lib/collections/comments/collection";
import Posts from "../../lib/collections/posts/collection";
import { areRecentlyDownvotedComments, isLowAverageKarmaContent, triggerAutomodIfNeededForUser } from "../callbacks/sunshineCallbackUtils";

async function getAutomodIfNeededForUser(user: DbUser) {
  const userId = user._id;

  const automodActions: DbModeratorAction['type'][] = [];

  const lowUserKarma = user.karma < -5;
  if (lowUserKarma) automodActions.push(NEGATIVE_KARMA_USER_ALERT)

  const [latestComments, latestPosts] = await Promise.all([
    Comments.find({ userId }, { sort: { postedAt: -1 }, limit: 20 }).fetch(),
    Posts.find({ userId }, { sort: { postedAt: -1 }, limit: 20 }).fetch()
  ]);

  const voteableContent = [...latestComments, ...latestPosts].sort((a, b) => b.postedAt.valueOf() - a.postedAt.valueOf());
  
  // TODO: vary threshold based on other user info (i.e. age/karma/etc)?

  const lowQualityComments = areRecentlyDownvotedComments(voteableContent);
  const mediocreQualityComments = isLowAverageKarmaContent(latestComments, 1.5);
  const mediocreQualityPosts = isLowAverageKarmaContent(latestPosts, 5);

  if (lowQualityComments) automodActions.push(RECENTLY_DOWNVOTED_CONTENT_ALERT);
  if (mediocreQualityComments) automodActions.push(LOW_AVERAGE_KARMA_COMMENT_ALERT);
  if (mediocreQualityPosts) automodActions.push(LOW_AVERAGE_KARMA_POST_ALERT);

  return automodActions;
}


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
            // .then((actions) => [user.displayName, actions] as const)
        ));
        // console.log(Object.fromEntries(userAutomodActions.filter(([, actions]) => actions.length > 0)));
      }
    });
  },
});
