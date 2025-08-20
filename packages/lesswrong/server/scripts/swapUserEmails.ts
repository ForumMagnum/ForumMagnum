/* eslint-disable no-console */

import Users from "../collections/users/collection";
import { getSqlClientOrThrow } from "../sql/sqlClient";

export const swapUserEmails = async (userId1: string, userId2: string) => {
  // We run the query atomically below, but fetch the users first just to
  // double check that the entered user ids are valid
  console.log(`Fetching users: ${userId2}, ${userId2}`);
  const [user1, user2] = await Promise.all([
    Users.findOne({_id: userId1}, {}, {_id: 1, displayName: 1}),
    Users.findOne({_id: userId2}, {}, {_id: 1, displayName: 1}),
  ]);
  if (!user1 || !user2) {
    throw new Error("Invalid users");
  }
  console.log(`Fetched users: ${user1.displayName}, ${user2.displayName}`);

  const db = getSqlClientOrThrow();
  await db.none(`
    WITH u1 AS (
      SELECT * FROM "Users" WHERE "_id" = $1
    ),
    u2 AS (
      SELECT * FROM "Users" WHERE "_id" = $2
    )
    UPDATE "Users" u
    SET
      "email" = CASE u."_id"
        WHEN $1 THEN (SELECT "email" FROM u2)
        WHEN $2 THEN (SELECT "email" FROM u1)
      END,
      "emails" = CASE u."_id"
        WHEN $1 THEN (SELECT "emails" FROM u2)
        WHEN $2 THEN (SELECT "emails" FROM u1)
      END,
      "services" = JSONB_SET(
        u."services",
        '{auth0}',
        CASE u."_id"
          WHEN $1 THEN (SELECT "services"->'auth0' FROM u2)
          WHEN $2 THEN (SELECT "services"->'auth0' FROM u1)
        END
      )
    WHERE u."_id" IN ($1, $2)
  `, [userId1, userId2]);

  console.log("Updated user emails");
}
