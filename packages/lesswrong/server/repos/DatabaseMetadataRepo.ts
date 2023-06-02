import AbstractRepo from "./AbstractRepo";
import { DatabaseMetadata } from "../../lib/collections/databaseMetadata/collection";
import { logIfSlow } from "../../lib/sql/sqlClient";

export default class DatabaseMetadataRepo extends AbstractRepo<DbDatabaseMetadata> {
  constructor() {
    super(DatabaseMetadata);
  }

  private getByName(name: string): Promise<DbDatabaseMetadata | null> {
    // We use getRawDb here as this may be executed during server startup
    // before the collection is properly initialized
    return logIfSlow(() => this.getRawDb().oneOrNone(
      `SELECT * from "DatabaseMetadata" WHERE "name" = $1`,
      [name],
    ), `DatabaseMetadata.${name}`);
  }

  getServerSettings(): Promise<DbDatabaseMetadata | null> {
    return this.getByName("serverSettings");
  }

  getPublicSettings(): Promise<DbDatabaseMetadata | null> {
    return this.getByName("publicSettings");
  }

  getDatabaseId(): Promise<DbDatabaseMetadata | null> {
    return this.getByName("databaseId");
  }
}
