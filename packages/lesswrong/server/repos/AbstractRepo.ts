import { forumTypeSetting } from "../../lib/instanceSettings";
import { getSqlClient } from "../../lib/sql/sqlClient";

/**
 * abstractRepo provides the superclass from which all of our collection
 * repositories are descended. Any common properties or functions
 * should be added here.
 *
 * To make the repo available in GraphQL resolvers, add it to `getAllRepos`
 * in index.ts
 */
export default abstract class AbstractRepo {
  protected db: SqlClient;

  constructor(sqlClient?: SqlClient) {
    const db = sqlClient ?? getSqlClient();
    if (db) {
      this.db = db;
    } else if (forumTypeSetting.get() === "EAForum") {
      throw new Error("Instantiating repo without a SQL client");
    } else {
      // TODO: For now, this is not an error since we need to have LessWrong
      // working without a SQL client - in the future the database should be
      // required. This does lead to the weird situation where this.db is not
      // nullable but is actually undefined, but this seems ~fine given the
      // circumstances.
    }
  }
}
