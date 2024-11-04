/**
 * Builds a Postgres query to create an extension by name.
 * Note that this doesn't actually extend `Query` like most other query types
 * as this query has no associated table.
 */
class CreateExtensionQuery {
  constructor(private extensionName: string) {}

  compile(): {sql: string, args: any[]} {
    return {
      sql: `CREATE EXTENSION IF NOT EXISTS "${this.extensionName}" CASCADE`,
      args: [],
    };
  }
}

export default CreateExtensionQuery;
