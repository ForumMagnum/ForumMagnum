import AbstractRepo from "./AbstractRepo";
import Users from "../../lib/collections/users/collection";

const GET_USERS_BY_EMAIL_QUERY = `
SELECT *
FROM "Users"
WHERE LOWER(email) = LOWER($1)
UNION
SELECT *
FROM "Users"
WHERE _id IN (
  SELECT _id
  FROM "Users", UNNEST(emails) unnested
  WHERE UNNESTED->>'address' = $1
)`;

const GET_USER_BY_USERNAME_OR_EMAIL_QUERY = `
SELECT *
FROM "Users"
WHERE username = $1
UNION
SELECT *
FROM "Users"
WHERE LOWER(email) = LOWER($1)
UNION
SELECT *
FROM "Users"
WHERE _id IN (
  SELECT _id
  FROM "Users", UNNEST(emails) unnested
  WHERE UNNESTED->>'address' = $1
)
LIMIT 1
`;

export type MongoNearLocation = { type: "Point", coordinates: number[] }
export default class UsersRepo extends AbstractRepo<DbUser> {
  constructor() {
    super(Users);
  }

  getUserByLoginToken(hashedToken: string): Promise<DbUser | null> {
    return this.oneOrNone(`
      SELECT *
      FROM "Users"
      WHERE "services"->'resume'->'loginTokens' @> ('[{"hashedToken": "' || $1 || '"}]')::JSONB
    `, [hashedToken]);
  }
  
  getUsersWhereLocationIsInNotificationRadius(location: MongoNearLocation): Promise<Array<DbUser>> {
    // the notification radius is in miles, so we convert the EARTH_DISTANCE from meters to miles
    return this.any(`
      SELECT *
      FROM "Users"
      WHERE (
        EARTH_DISTANCE(
          LL_TO_EARTH(
            ("nearbyEventsNotificationsMongoLocation"->'coordinates'->0)::FLOAT8,
            ("nearbyEventsNotificationsMongoLocation"->'coordinates'->1)::FLOAT8
          ),
          LL_TO_EARTH($1, $2)
        ) * 0.000621371
      ) < "nearbyEventsNotificationsRadius"
    `, [location.coordinates[0], location.coordinates[1]])
  }

  getUserByEmail(email: string): Promise<DbUser | null> {
    return this.oneOrNone(`
      ${GET_USERS_BY_EMAIL_QUERY}
      LIMIT 1
    `, [email]);
  }

  getAllUsersByEmail(email: string): Promise<DbUser[]> {
    return this.any(GET_USERS_BY_EMAIL_QUERY, [email]);
  }

  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<DbUser | null> {
    return this.oneOrNone(GET_USER_BY_USERNAME_OR_EMAIL_QUERY, [usernameOrEmail]);
  }

  clearLoginTokens(userId: string): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET services = jsonb_set(
        services,
        '{resume, loginTokens}'::TEXT[],
        '[]'::JSONB,
        true
      )
      WHERE _id = $1
    `, [userId]);
  }

  resetPassword(userId: string, hashedPassword: string): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET services = jsonb_set(
        jsonb_set(
          services,
          '{password, bcrypt}'::TEXT[],
          to_jsonb($2::TEXT),
          true
        ),
        '{resume, loginTokens}'::TEXT[],
        '[]'::JSONB,
        true
      )
      WHERE _id = $1
    `, [userId, hashedPassword]);
  }

  verifyEmail(userId: string): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET emails[1] = jsonb_set(emails[1], '{verified}', 'true'::JSONB, true)
      WHERE _id = $1
    `, [userId]);
  }
  
  setExpandFrontpageSection(userId: string, section: string, expanded: boolean) {
    return this.none(`
      UPDATE "Users"
      SET "expandedFrontpageSections" =
        COALESCE("expandedFrontpageSections", '{}'::JSONB) ||
          fm_build_nested_jsonb(('{' || $2 || '}')::TEXT[], $3::JSONB)
      WHERE "_id" = $1
    `, [userId, section, String(expanded)]);
  }
}
