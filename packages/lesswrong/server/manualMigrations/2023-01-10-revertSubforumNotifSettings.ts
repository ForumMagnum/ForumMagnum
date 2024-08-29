/* eslint-disable no-console */
import { LWEvents } from '../../lib/collections/lwevents';
import { Subscriptions } from '../../lib/collections/subscriptions';
import UserTagRels from '../../lib/collections/userTagRels/collection';
import { getSqlClientOrThrow } from '../../server/sql/sqlClient';
import { getSchema } from '../../lib/utils/getSchema';
import { registerMigration } from './migrationUtils';

registerMigration({
  name: "revertSubforumNotifSettings",
  dateWritten: "2023-01-10",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();

    // fetch all the subforum tags
    const subforumTags = await db.any(`SELECT _id, "slug" FROM "Tags" where "isSubforum" is true`)
    const subforumTagIds = subforumTags.map(tag => tag._id)
    
    /**
     * Revert post notifications
     *
     * Warning: this logic is very confusing.
     *
     * The way Subscriptions work is that when you subscribe/unsubscribe the old subscription is soft deleted (by setting deleted: true), and a new one is created. We want to soft delete all subscriptions that were created by joining a subforum,
     * or were deliberately migrated by updateSubforumNotificationDefaults.
     *
     * As it happens, the subscriptions created by updateSubforumNotificationDefaults were dropped in the migration to postgres (due to _id being an ObjectId rather than a string),
     * so there is nothing to do there.
     *
     * For the others, I couldn't find a straightforward way to distinguish between ones created by joining a subforum and ones created by deliberately ticking the box. But there are only 11 between the dates when
     * the notifications defaulted to ON and from eyeballing them it looks like they were all created by joining a subforum, so I'm just using the date range to filter them out.
     */

    // Based on when the PRs were deployed. There is the possibility for some edge cases here, but as a matter of fact there aren't any
    // rows that close to either of these times so it's fine.
    const notifsEnabledDatetime = '2022-12-05 13:47:00'
    const notifsDisabledDatetime = '2022-12-24 17:41:00'
    
    /**
     * This query filters by the following criteria:
     * - The subscription is for a subforum, with state = 'subscribed' (rather than 'supressed')
     * - It was created between the dates when the notifications were enabled by default
     * - There is only one subscription for the user and document, meaning (probably) that the user was auto-subscribed by joining and hasn't subsequently unsubscribed
     *   - Edge case: The user was already deliberately unsubscribed from the tag before the subforum existed, and then joined the subforum which caused them to subscribe.
     *     I have checked the cases where there is more than one subscription row and in the only case like this they were already *subscribed* before the subforum was created,
     *     so it's fine to leave that one
     */
    const matchingSubscriptionsSql = `
    SELECT
      subscription_ids
    FROM (
      SELECT
        count(*) AS total_count,
        max("createdAt") AS most_recent_change,
        array_agg("state") as subscribed_state,
        array_agg("deleted") as deleted_state,
        array_agg("_id") as subscription_ids,
        "userId",
        "documentId"
      FROM
        "Subscriptions"
      WHERE
        "documentId" IN (${subforumTagIds.map(id => `'${id}'`).join(",")}) -- forecasting, software-engineering, effective-giving, bioethics
      GROUP BY
        "userId",
        "documentId") A
      WHERE
        total_count = 1 AND most_recent_change > '${notifsEnabledDatetime}' AND most_recent_change < '${notifsDisabledDatetime}' AND
        '{subscribed}' @> subscribed_state AND '{f}' @> deleted_state
    ORDER BY
      most_recent_change DESC, "documentId";
    `
    const matchingSubscriptions = await db.any(matchingSubscriptionsSql)
    const matchingSubscriptionIds = matchingSubscriptions.map(sub => sub.subscription_ids[0])
    
    console.log(`Found ${matchingSubscriptionIds.length} subscriptions to soft delete`)
    if (matchingSubscriptionIds.length < 25) { // I happen to know there are only 11, so it's useful to have this in the logs
      console.log("Subscription ids:", matchingSubscriptionIds)
    }

    // set deleted to true for all of them (only soft delete in case we want to do future data munging related to this)
    await Subscriptions.rawUpdateMany({_id: {$in: matchingSubscriptionIds}}, {$set: {deleted: true}})
    
    /**
     * Revert discussion notifications
     *
     * Update all to the current default (false), excluding those which have been edited by the user
     */
    const userEditedTagRels = await LWEvents.find({"name": "fieldChanges", $or: [{"properties.before.subforumEmailNotifications": {$exists: true}}, {"properties.after.subforumEmailNotifications": {$exists: true}}]}).fetch()
    const userEditedTagRelIds = [...new Set(userEditedTagRels.map(rel => rel.documentId))]
    console.log(`Found ${userEditedTagRelIds.length} UserTagRels to ignore (because they have been edited by the user)`)
    if (userEditedTagRelIds.length < 25) { // I happen to know there are only 11, so it's useful to have this in the logs
      console.log("UserTagRel ids:", userEditedTagRelIds)
    }
    
    // Update all other UserTagRels to have the default value (false)
    const schema = getSchema(UserTagRels);
    const defaultValue = schema["subforumEmailNotifications"].defaultValue;
    console.log(`Setting subforumEmailNotifications to ${defaultValue} for all but ${userEditedTagRelIds.length} rows`)
    await UserTagRels.rawUpdateMany({_id: {$nin: userEditedTagRelIds}, subforumEmailNotifications: {$ne: defaultValue}}, {$set: {subforumEmailNotifications: defaultValue}})
  }
})
