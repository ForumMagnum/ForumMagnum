import CurationEmails from "../../lib/collections/curationEmails/collection";
import { isEAForum } from "../../lib/instanceSettings";
import { randomId } from "../../lib/random";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class CurationEmailsRepo extends AbstractRepo<"CurationEmails"> {
  constructor() {
    super(CurationEmails);
  }

  recordSentEmail(userId: string, postId: string) {
    const now = new Date();

    return this.none(`
    -- CurationEmailsRepo.recordSentEmail
    INSERT INTO "CurationEmails" (
      "_id",
      "userId",
      "postId",
      "updatedAt",
      "createdAt"
    ) VALUES (
      $1, $2, $3, $4, $4
    ) ON CONFLICT ("userId") DO UPDATE SET
      "postId" = $3,
      "updatedAt" = $4
    `, [randomId(), userId, postId, now]);
  }

  getUserIdsToEmail(curatedPostId: string): Promise<string[]> {
    const verifiedEmailFilter = !isEAForum ? 'AND fm_has_verified_email(emails)' : '';

    return this.getRawDb().any(`
      WITH curation_status AS (
        SELECT
          -- Check whether we've already finished curating this post
          ((COUNT(DISTINCT("postId")) FILTER (WHERE "postId" != $1)) = 0) AS is_finished
        FROM "CurationEmails" AS ce
        -- Exclude admins from being counted as users when figuring out whether we're picking up from an interrupted job
        WHERE ce."userId" NOT IN (
          SELECT _id
          FROM "Users"
          WHERE "isAdmin" IS TRUE
        )
      )
      SELECT _id
      FROM "Users"
      WHERE "emailSubscribedToCurated" IS TRUE
        AND "deleted" IS NOT TRUE
        AND "email" IS NOT NULL
        AND "unsubscribeFromAll" IS NOT TRUE
        ${verifiedEmailFilter}
      AND (
        CASE
          -- If we've already finished curating this post, we don't want to return any userIds.
          -- This is to stop us from emailing every new user who registers or otherwise subscribes to curated emails well after the post was curated, since the cron job runs frequently.
          WHEN (SELECT is_finished FROM curation_status)
            THEN false
          -- Otherwise, return all subscribed userIds who haven't already been sent this post
          -- This handles both the case where we're starting fresh and where we're picking up an interrupted job
          ELSE (
            _id NOT IN (
              SELECT "userId"
              FROM "CurationEmails" AS ce
              WHERE ce."postId" = $1
          )
        END
      )
    `, [curatedPostId]);
  }
}

recordPerfMetrics(CurationEmailsRepo);

export default CurationEmailsRepo;
