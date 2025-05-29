import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { registerMigration } from './migrationUtils';

// This has to be done as a manual migration because of a bootstrapping issue (typeerrors block the automatic migration from running)
export default registerMigration({
  name: "createUserActivities",
  dateWritten: "2023-03-16",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();

    const sql = `
    CREATE TABLE IF NOT EXISTS "UserActivities" (
      _id varchar(27) PRIMARY KEY,
      "visitorId" varchar(27),
      "type" text,
      "startDate" timestamptz,
      "endDate" timestamptz,
      "activityArray" double precision[],
      "schemaVersion" double precision DEFAULT 1,
      "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
      "legacyData" jsonb
    );
    `
    await db.any(sql)
  }
})
