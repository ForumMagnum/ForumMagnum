import { getSqlClientOrThrow } from "../sql/sqlClient";
import { Globals } from "../vulcan-lib";

async function getUsersWithLaTeXPosts() {
  const db = getSqlClientOrThrow();

  const result = await db.any<{
    _id: string;
    displayName: string;
    karma: number;
  }>(`
    SELECT
      u._id,
      u."displayName",
      u.karma,
      (
        SELECT COUNT(*) 
        FROM "Posts" p2 
        WHERE p2.draft IS FALSE 
        AND p2."userId" = u._id 
        AND p2."postedAt" > CURRENT_DATE - INTERVAL '1 year'
      ) AS "lastYearPostCount",
      ARRAY_AGG(p.title ORDER BY p."postedAt" DESC) AS "titles"
    FROM "Users" u
    JOIN "Posts" p ON u._id = p."userId"
    JOIN "Revisions" r ON p.contents_latest = r._id
    WHERE 1=1
    AND u.karma > 0
    AND r.html LIKE '%mjpage%'
    AND p.draft IS FALSE
    AND p."postedAt" > CURRENT_DATE - INTERVAL '1 year'
    GROUP BY 1, 2, 3, 4
    ORDER BY ((
      SELECT COUNT(*) 
      FROM "Posts" p2 
      WHERE p2.draft IS FALSE 
      AND p2."userId" = u._id 
      AND p2."postedAt" > CURRENT_DATE - INTERVAL '1 year'
    ) * LOG(u.karma::numeric, 2)) DESC
    LIMIT 100
  `);

  console.log(result);
}

Globals.getUsersWithLaTeXPosts = getUsersWithLaTeXPosts;
