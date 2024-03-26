export const up = async ({db}: MigrationContext) => {
  await db.none(`
    WITH RankedUserJobAds AS (
        SELECT
            _id,
            "userId",
            "jobName",
            "adState",
            "reminderSetAt",
            "lastUpdated",
            ROW_NUMBER() OVER (
                PARTITION BY "userId", "jobName"
                ORDER BY
                    CASE WHEN "reminderSetAt" IS NOT NULL THEN 0 ELSE 1 END,
                    CASE "adState"
                        WHEN 'reminderSet' THEN 1
                        WHEN 'applied' THEN 2
                        WHEN 'expanded' THEN 3
                        WHEN 'seen' THEN 4
                        ELSE 5
                    END,
                    "lastUpdated" DESC
            ) AS rn
        FROM "UserJobAds"
    )
    DELETE FROM "UserJobAds"
    WHERE _id IN (
        SELECT _id FROM RankedUserJobAds WHERE rn > 1
    )
  `)
}

export const down = async ({db}: MigrationContext) => {
  // noop
}
