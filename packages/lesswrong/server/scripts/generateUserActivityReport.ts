import TagRels from "../../lib/collections/tagRels/collection";
import Tags from "../../lib/collections/tags/collection";
import { Globals } from "../vulcan-lib";
import { updatePostDenormalizedTags } from "../tagging/tagCallbacks";
import { randomId } from "../../lib/random";
import { getSqlClient, getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { calculateActivityFactor } from "../useractivities/utils";
import { activityHalfLifeSetting } from "../../lib/scoring";
import { fs } from "mz";

const defaultHalfLife = activityHalfLifeSetting.get()
const generateUserActivityReport = async (activityHalfLifeHours: number = defaultHalfLife) => {
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
    const activityFactor = calculateActivityFactor(row.activityArray, activityHalfLifeHours); // Replace 48 with your halfLifeHours value
    return { userId: row.userId, slug: row.slug, activityFactor };
  });
  
  const csvFileName = 'user_activity_factors.csv';
  const header = 'user_id,slug,activity_factor\n';
  const fileRows = results.map(row => `${row.userId},${row.slug},${row.activityFactor}`).join('\n');
  fs.writeFileSync(csvFileName, header + fileRows);

  // eslint-disable-next-line no-console
  console.log(`User activity factors saved to ${csvFileName}`);
}

Globals.generateUserActivityReport = generateUserActivityReport;
