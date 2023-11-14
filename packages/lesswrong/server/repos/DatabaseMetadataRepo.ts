import AbstractRepo from "./AbstractRepo";
import { DatabaseMetadata } from "../../lib/collections/databaseMetadata/collection";
import { logIfSlow } from "../../lib/sql/sqlClient";
import type { TimeSeries } from "../../lib/collections/posts/karmaInflation";
import { randomId } from "../../lib/random";

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

  upsertKarmaInflationSeries(karmaInflationSeries: TimeSeries): Promise<null> {
    return this.none(`
      INSERT INTO "DatabaseMetadata" (
        "_id",
        "name",
        "value",
        "schemaVersion",
        "createdAt"
      ) VALUES (
        $(_id), $(name), $(value), $(schemaVersion), $(createdAt)
      ) ON CONFLICT (
        COALESCE("name", '')
      )
      DO UPDATE SET
        "value" = $(value)
      `, {
      _id: randomId(),
      name: "karmaInflationSeries",
      value: {...karmaInflationSeries},
      schemaVersion: 1,
      createdAt: new Date(),
    });
  }
}
