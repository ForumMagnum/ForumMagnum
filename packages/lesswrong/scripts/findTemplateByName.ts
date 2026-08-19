import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

export async function findTemplateByName(pattern: string) {
  const db = getSqlClientOrThrow();
  const rows = await db.any(`
    -- findTemplateByName
    SELECT _id, name, "collectionName", deleted
    FROM "ModerationTemplates"
    WHERE name ILIKE $(pattern)
    ORDER BY name
  `, { pattern: `%${pattern}%` });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(rows, null, 2));
}

export async function recentTemplates() {
  const db = getSqlClientOrThrow();
  const rows = await db.any(`
    -- recentTemplates
    SELECT _id, name, "collectionName", deleted, "createdAt"
    FROM "ModerationTemplates"
    ORDER BY "createdAt" DESC
    LIMIT 10
  `);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(rows, null, 2));
}
