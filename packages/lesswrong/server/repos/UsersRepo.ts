import AbstractRepo from "./AbstractRepo";
import Users from "../../lib/collections/users/collection";

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
      SELECT *
      FROM "Users"
      WHERE (LOWER("email") = LOWER($1)
      OR (_ID IN (
        SELECT _ID
        FROM "Users"
        WHERE to_jsonb("emails") @> ('[{"address": "' || $1 || '"}]')::JSONB)))
      LIMIT 1
    `, [email]);
  }

  getAllUsersByEmail(email: string): Promise<DbUser[]> {
    return this.any(`
      SELECT *
      FROM "Users"
      WHERE (LOWER("email") = LOWER($1)
      OR (_ID IN (
        SELECT _ID
        FROM "Users"
        WHERE to_jsonb("emails") @> ('[{"address": "' || $1 || '"}]')::JSONB)))
    `, [email]);
  }
}
