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

  setExpandFrontpageSection(userId: string, section: string, expanded: boolean): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET "expandedFrontpageSections" =
        COALESCE("expandedFrontpageSections", '{}'::JSONB) ||
          fm_build_nested_jsonb(('{' || $2 || '}')::TEXT[], $3::JSONB)
      WHERE "_id" = $1
    `, [userId, section, String(expanded)]);
  }

  removeAlignmentGroupAndKarma(userId: string, reduceAFKarma: number): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET
        "groups" = array_remove("groups", 'alignmentVoters'),
        "afKarma" = "afKarma" - $2
      WHERE _id = $1
    `, [userId, reduceAFKarma]);
  }

  private getSearchDocumentQuery(): string {
    return `
      SELECT
        u."_id",
        u."_id" AS "objectID",
        u."username",
        u."displayName",
        u."createdAt",
        EXTRACT(EPOCH FROM u."createdAt") * 1000 AS "publicDateMs",
        COALESCE(u."isAdmin", FALSE) AS "isAdmin",
        COALESCE(u."deleted", FALSE) AS "deleted",
        COALESCE(u."deleteContent", FALSE) AS "deleteContent",
        u."profileImageId",
        u."biography"->>'html' AS "bio",
        u."howOthersCanHelpMe"->>'html' AS "howOthersCanHelpMe",
        u."howICanHelpOthers"->>'html' AS "howICanHelpOthers",
        COALESCE(u."karma", 0) AS "karma",
        u."slug",
        u."jobTitle",
        u."organization",
        u."careerStage",
        u."website",
        u."groups",
        u."groups" @> ARRAY['alignmentForum'] AS "af",
        u."profileTagIds",
        u."mapLocation"->'geometry'->'location' AS "_geoloc",
        u."mapLocation"->'formatted_address' AS "mapLocationAddress"
      FROM "Users" u
    `;
  }

  getSearchDocumentById(id: string): Promise<AlgoliaUser> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE u."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<AlgoliaUser[]> {
    return this.getRawDb().any(`
      ${this.getSearchDocumentQuery()}
      WHERE u."displayName" IS NOT NULL
      ORDER BY u."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "Users"`);
    return count;
  }
}
