import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";

/**
 * abstractRepo provides the superclass from which all of our collection
 * repositories are descended. Any common properties or functions
 * should be added here.
 *
 * To make the repo available in GraphQL resolvers, add it to `getAllRepos`
 * in index.ts
 */
export default abstract class AbstractRepo {
  constructor(protected db: SqlClient = getSqlClientOrThrow()) {}
}
