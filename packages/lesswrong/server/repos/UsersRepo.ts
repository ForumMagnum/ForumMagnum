import AbstractRepo from "./AbstractRepo";

export default class UsersRepo extends AbstractRepo {
  getUserByLoginToken(hashedToken: string): Promise<DbUser | null> {
    return this.db.oneOrNone(`
      SELECT *
      FROM "Users"
      WHERE "services"->'resume'->'loginTokens' @> ('[{"hashedToken": "' || $1 || '"}]')::JSONB
    `, [hashedToken]);
  }
}
