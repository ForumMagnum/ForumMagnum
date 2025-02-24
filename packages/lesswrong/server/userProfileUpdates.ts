import { Globals } from "../lib/vulcan-lib/config";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

export const simpleUserProfileFields: (keyof DbUser)[] = [
  "username",
  "displayName",
  "organizerOfGroupIds",
  "programParticipation",
  "googleLocation",
  "location",
  "mapLocation",
  "profileImageId",
  "jobTitle",
  "organization",
  "careerStage",
  "website",
  "linkedinProfileURL",
  "facebookProfileURL",
  "blueskyProfileURL",
  "twitterProfileURL",
  "githubProfileURL",
  "profileTagIds",
];

export const editableUserProfileFields: (keyof DbUser)[] = [
  "biography",
  "howOthersCanHelpMe",
  "howICanHelpOthers",
];

export const allUserProfileFields = [
  ...simpleUserProfileFields,
  ...editableUserProfileFields,
];

const backfillUserProfileUpdatedAt = async () => {
  const db = getSqlClientOrThrow();

  // We need to do this in batches as it's blocking and very slow.
  const batchSize = 200;

  // Add an upper limit of 1000000 rows as a sanity check. This should never
  // happen, but nobody likes infinite loops.
  for (let i = 0; i < 10000; i++) {
    // eslint-disable-next-line no-console
    console.log(`regenerateUserProfileUpdatedAt: Starting batch ${i}...`);
    const {rowCount} = await db.result(`
      UPDATE "Users"
      SET "profileUpdatedAt" = fm_get_user_profile_updated_at("_id")
      WHERE "_id" IN (
        SELECT "_id"
        FROM "Users"
        WHERE "profileUpdatedAt" < '1971-01-01'::TIMESTAMPTZ
        LIMIT $1
      )
    `, [batchSize]);
    if (rowCount < batchSize) {
      break;
    }
  }
}

Globals.backfillUserProfileUpdatedAt = backfillUserProfileUpdatedAt;
