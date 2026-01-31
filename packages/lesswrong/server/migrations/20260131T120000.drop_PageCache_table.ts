export const up = async ({db}: MigrationContext) => {
  await db.none('DROP TABLE IF EXISTS "PageCache";');
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`
    CREATE UNLOGGED TABLE "PageCache" (
      _id VARCHAR(27) PRIMARY KEY,
      "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "legacyData" JSONB,
      "path" TEXT NOT NULL,
      "abTestGroups" JSONB NOT NULL,
      "bundleHash" TEXT NOT NULL,
      "renderedAt" TIMESTAMPTZ NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "ttlMs" DOUBLE PRECISION NOT NULL,
      "renderResult" JSONB NOT NULL
    );
  `);
  await db.none(`
    CREATE INDEX IF NOT EXISTS "idx_PageCache_path_bundleHash_expiresAt"
    ON "PageCache" USING btree ("path", "bundleHash", "expiresAt");
  `);
  await db.none(`
    CREATE UNIQUE INDEX IF NOT EXISTS "idx_PageCache_path_abTestGroups_bundleHash"
    ON public."PageCache" USING btree (path, "abTestGroups", "bundleHash");
  `);
}
