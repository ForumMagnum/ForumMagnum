import AbstractRepo from "./AbstractRepo";
import Users from "../../lib/collections/users/collection";

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
}
