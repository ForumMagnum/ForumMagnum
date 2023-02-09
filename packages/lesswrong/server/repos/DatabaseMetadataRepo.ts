import AbstractRepo from "./AbstractRepo";
import { DatabaseMetadata } from "../../lib/collections/databaseMetadata/collection";

export default class DatabaseMetadataRepo extends AbstractRepo<DbDatabaseMetadata> {
  constructor() {
    super(DatabaseMetadata);
  }

  private async getByName(name: string): Promise<DbDatabaseMetadata | null> {
    const result = await this.getRawDb().oneOrNone(
      `SELECT "value" from "DatabaseMetadata" WHERE "name" = $1`,
      [name],
    );
    return result?.value;
  }

  async getServerSettings(): Promise<DbDatabaseMetadata | null> {
    return this.getByName("serverSettings");
  }

  async getPublicSettings(): Promise<DbDatabaseMetadata | null> {
    return this.getByName("publicSettings");
  }

  async getDatabaseId(): Promise<DbDatabaseMetadata | null> {
    return this.getByName("databaseId");
  }
}
