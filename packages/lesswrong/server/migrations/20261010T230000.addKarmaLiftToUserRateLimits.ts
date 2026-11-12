import UserRateLimits from "@/server/collections/userRateLimits/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, UserRateLimits, "liftAtAverageKarma");
  await addField(db, UserRateLimits, "liftAverageKarmaCount");
  // Limits that only lift on karma have no end date
  await db.none(`ALTER TABLE "UserRateLimits" ALTER COLUMN "endedAt" DROP NOT NULL`);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, UserRateLimits, "liftAtAverageKarma");
  await dropField(db, UserRateLimits, "liftAverageKarmaCount");
}
