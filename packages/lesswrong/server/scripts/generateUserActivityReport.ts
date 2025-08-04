import { getSqlClientOrThrow } from "../sql/sqlClient";
import { calculateActivityFactor } from "../../lib/collections/useractivities/utils";
import { activityHalfLifeSetting } from "../../lib/scoring";
import fs from "fs";

const defaultHalfLife = activityHalfLifeSetting.get()

// Exported to allow running manually with "yarn repl"
export const generateUserActivityReport = async (activityHalfLifeHours: number = defaultHalfLife) => {
  const db = getSqlClientOrThrow()

  const query = `
    SELECT
      u.slug,
      u."_id" as "userId",
      ua."activityArray"
    FROM
      "UserActivities" ua
      JOIN "Users" u ON u."_id" = ua."visitorId"
    WHERE
      ua.type = 'userId';
  `;

  const rows = await db.any(query);
  
  const results = rows.map(row => {
    const activityFactor = calculateActivityFactor(row.activityArray, activityHalfLifeHours);
    return { userId: row.userId, slug: row.slug, activityFactor };
  }).sort((a, b) => b.activityFactor - a.activityFactor);
  
  const csvFileName = 'user_activity_factors.csv';
  const header = 'user_id,slug,activity_factor\n';
  const fileRows = results.map(row => `${row.userId},${row.slug},${row.activityFactor}`).join('\n');
  fs.writeFileSync(csvFileName, header + fileRows);

  // eslint-disable-next-line no-console
  console.log(`User activity factors saved to ${csvFileName}`);
}
