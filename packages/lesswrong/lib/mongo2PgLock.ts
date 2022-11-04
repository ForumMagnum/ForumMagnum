import { getSqlClientOrThrow } from '../lib/sql/sqlClient';
import { Collections } from '../lib/vulcan-lib/getCollection';

const collectionTypes = ["mongo", "pg"] as const;

type CollectionType = typeof collectionTypes[number];

const mongo2PgLock = new class {
  private readonly tableName = "mongo2pg_lock";
  private readonly valuesConstraint = "collection_type_constraint";
  private isEnsured = false;

  private async ensureTableExists(db: SqlClient): Promise<void> {
    if (this.isEnsured) {
      return;
    }
    this.isEnsured = true;

    await db.none(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        collection_name TEXT PRIMARY KEY,
        collection_type TEXT DEFAULT '${collectionTypes[0]}'
      );
    `);
    await db.none(`
      ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS ${this.valuesConstraint};
    `);
    await db.none(`
      ALTER TABLE ${this.tableName} ADD CONSTRAINT ${this.valuesConstraint}
      CHECK (collection_type IN ('mongo', 'pg'));
    `);

    const collectionNames = Collections.map(({options: {collectionName}}) => `('${collectionName}')`);
    await db.none(`
      INSERT INTO ${this.tableName} (collection_name) VALUES
      ${collectionNames.join(", ")}
      ON CONFLICT DO NOTHING;
    `);
  }

  async getCollectionType(db: SqlClient, collectionName: CollectionNameString): Promise<CollectionType> {
    await this.ensureTableExists(db);
    const result = await db.one(
      `SELECT collection_type FROM ${this.tableName} WHERE collection_name = $1;`,
      [collectionName],
    );
    return result.collection_type ?? collectionTypes[0];
  }

  async setCollectionType(db: SqlClient, collectionName: CollectionNameString, type: CollectionType): Promise<void> {
    await this.ensureTableExists(db);
    await db.none(
      `UPDATE ${this.tableName} SET collection_type = $1 WHERE collection_name= $2;`,
      [type, collectionName],
    );
  }
}

export const getCollectionLockType = async (collectionName: CollectionNameString): Promise<CollectionType> =>
  mongo2PgLock.getCollectionType(getSqlClientOrThrow(), collectionName);

export const setCollectionLockType = async (
  collectionName: CollectionNameString,
  collectionType: CollectionType,
): Promise<void> =>
  mongo2PgLock.setCollectionType(getSqlClientOrThrow(), collectionName, collectionType);
