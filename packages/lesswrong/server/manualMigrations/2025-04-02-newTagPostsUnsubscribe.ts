/* eslint-disable no-console */
import { getAnalyticsConnectionOrThrow } from "../analytics/postgresConnection";
import { registerMigration } from "./migrationUtils";
import Subscriptions from "../collections/subscriptions/collection";
import Users from "../collections/users/collection";
import Tags from "../collections/tags/collection";
import { createAdminContext } from "../vulcan-lib/createContexts";
import keyBy from "lodash/keyBy";
import { updateMutator } from "../vulcan-lib/mutators";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { isFriendlyUI } from "@/themes/forumTheme";

export default registerMigration({
  name: "newTagPostsUnsubscribe",
  dateWritten: "2025-04-02",
  idempotent: true,
  /**
   * During onboarding, subscribing to a tag previously enabled notifications, rather than just upweighting it on the frontpage.
   * This has now been changed, but many users are still receiving a lot of notifications from these subscriptions. This migration
   * deletes any subscriptions created during onboarding where the user has not later updated them.
   */
  action: async () => {
    if (!isFriendlyUI) throw new Error("Subscribing to tags during onboarding was only a feature under FriendlyUI, there is no need to run this for other UI styles")

    const dryRun = true;

    const adminContext = createAdminContext();

    // 1) Fetch all subscribeClicked events for tags from the onboarding flow
    const analyticsDb = getAnalyticsConnectionOrThrow();
    const analyticsRows = await analyticsDb.any<{
      tagId: string;
      userId: string;
      maxTimestamp: string | null;
    }>(`
      SELECT
        event ->> 'documentId' as "tagId",
        event ->> 'userId' as "userId",
        MAX(timestamp) as "maxTimestamp"
      FROM raw
      WHERE
        event_type = 'subscribeClicked'
        AND event ->> 'documentType' = 'tags'
        AND event ->> 'pageElementContext' = 'onboardingFlow'
      GROUP BY
        event ->> 'documentId',
        event ->> 'userId'
      ORDER BY
        MAX(timestamp) DESC
    `);
    console.log(`Fetched ${analyticsRows.length} rows from analytics DB.`);

    const userIds = Array.from(new Set(analyticsRows.map(row => row.userId)));
    const tagIds = Array.from(new Set(analyticsRows.map(row => row.tagId)));

    const allUsers = await Users.find({ _id: { $in: userIds } }, { projection: { _id: 1, slug: 1 } }).fetch();
    const allTags = await Tags.find({ _id: { $in: tagIds } }, { projection: { _id: 1, slug: 1 } }).fetch();

    const userMap = keyBy(allUsers, "_id");
    const tagMap = keyBy(allTags, "_id");

    let skipCount = 0;
    let updateCount = 0;

    // 2) For each returns userId, tagId pair:
    // - If there are no new subscriptions (by tagId, userId) since the latest onboarding click event (+30s leeway), delete any existing subscriptions
    // - Otherwise, do nothing (the user has updated the subscriptions themselves, so we don't want to edit them)
    const tasks = analyticsRows.map(row => async () => {
      const { tagId, userId, maxTimestamp } = row;
      const userSlug = userMap[userId]?.slug ?? "unknown";
      const tagSlug = tagMap[tagId]?.slug ?? "unknown";

      let action: "Skipped" | "Would update" | "Updated" | null = null;
      let explanation:
        | "no timestamp"
        | "no matching subscriptions"
        | "subscription edited later by the user"
        | `rows=${number}`
        | "nothing to update"
        | null = null;
      let updatedRows = 0;

      if (!maxTimestamp) {
        skipCount++;
        action = "Skipped";
        explanation = "no timestamp";
      } else {
        const eventTime = new Date(maxTimestamp);
        const cutoffTime = eventTime.getTime() + 30_000;

        const subs = await Subscriptions.find({
          userId,
          documentId: tagId,
          collectionName: "Tags",
          type: "newTagPosts",
        }).fetch();

        if (!subs || subs.length === 0) {
          skipCount++;
          action = "Skipped";
          explanation = "no matching subscriptions";
        } else {
          const hasLaterSub = subs.some(s => {
            const createdDate = new Date(s.createdAt);
            return createdDate.getTime() > cutoffTime;
          });

          if (hasLaterSub) {
            skipCount++;
            action = "Skipped";
            explanation = "subscription edited later by the user";
          } else {
            const unsubscribableRows = subs.filter(sub => !sub.deleted && sub.state === 'subscribed');
            updatedRows = unsubscribableRows.length;

            if (updatedRows > 0) {
              updateCount++;
              if (dryRun) {
                action = "Would update";
                explanation = `rows=${updatedRows}`;
              } else {
                await Promise.all(unsubscribableRows.map(subDoc =>
                  updateMutator({
                    collection: Subscriptions,
                    documentId: subDoc._id,
                    set: { deleted: true },
                    context: adminContext,
                    currentUser: adminContext.currentUser,
                    validate: false
                  })
                ));
                action = "Updated";
                explanation = `rows=${updatedRows}`;
              }
            } else {
              skipCount++;
              action = "Skipped";
              explanation = "nothing to update";
            }
          }
        }
      }

      if (action === "Skipped") {
        console.log(
          `Skipped userId=${userId} (slug=${userSlug}), tagId=${tagId} (slug=${tagSlug}): ${explanation}`
        );
      } else if (action === "Would update") {
        console.log(
          `DRY_RUN: Would update userId=${userId} (slug=${userSlug}), tagId=${tagId} (slug=${tagSlug}), ${explanation}`
        );
      } else if (action === "Updated") {
        console.log(
          `UPDATED userId=${userId} (slug=${userSlug}), tagId=${tagId} (slug=${tagSlug}), ${explanation}`
        );
      }
    });

    await executePromiseQueue(tasks, 10);

    console.log(`\nDone processing. Skipped: ${skipCount}, Updated: ${updateCount}, dryRun=${dryRun}`);
  },
});
