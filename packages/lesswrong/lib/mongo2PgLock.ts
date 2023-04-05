import { getSqlClientOrThrow } from '../lib/sql/sqlClient';
import { Collections } from '../lib/vulcan-lib/getCollection';

export type ReadTarget = "mongo" | "pg";
export type WriteTarget = ReadTarget | "both";

export type ReadWriteTargets = {
  read: ReadTarget,
  write: WriteTarget,
};

const mongo2PgLock = new class {
  private readonly tableName = "mongo2pg_lock";
  private readonly readConstraint = "read_constraint";
  private readonly writeConstraint = "write_constraint";
  private isEnsured = false;

  getSchemaQueries(): string[] {
    const result: string[] = [
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        collection_name TEXT PRIMARY KEY,
        read_target TEXT DEFAULT 'mongo',
        write_target TEXT DEFAULT 'mongo'
      )`,
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS ${this.readConstraint}`,
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS ${this.writeConstraint}`,
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${this.readConstraint}
        CHECK (read_target IN ('mongo', 'pg'))`,
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${this.writeConstraint}
        CHECK (write_target IN ('mongo', 'pg', 'both'))`,
    ];
    return result;
  }

  async ensureTableExists(db: SqlClient, force = false): Promise<void> {
    if (this.isEnsured && !force) {
      return;
    }
    this.isEnsured = true;

    await db.tx(async (transaction) => {
      const schema = this.getSchemaQueries();
      for (const query of schema) {
        await transaction.none(query);
      }
      const collectionNames = Collections.map(({options: {collectionName}}) => `('${collectionName}')`);
      await transaction.none(`
        INSERT INTO ${this.tableName} (collection_name) VALUES
        ${collectionNames.join(", ")}
        ON CONFLICT DO NOTHING;
      `);
    })
  }

  async getCollectionType(
    db: SqlClient,
    collectionName: CollectionNameString,
  ): Promise<ReadWriteTargets> {
    await this.ensureTableExists(db);
    const result = await db.one(`
      SELECT read_target AS read, write_target AS write
      FROM ${this.tableName}
      WHERE collection_name = $1;
    `, [collectionName]);
    return result ?? {read: 'mongo', write: 'mongo'};
  }

  async setCollectionType(
    db: SqlClient,
    collectionName: CollectionNameString,
    read: ReadTarget,
    write: WriteTarget,
  ): Promise<void> {
    await this.ensureTableExists(db);
    await db.none(`
      UPDATE ${this.tableName}
      SET read_target = $1, write_target = $2
      WHERE collection_name= $3;
    `, [read, write, collectionName]);
  }
}

export const ensureMongo2PgLockTableExists = (db?: SqlClient): Promise<void> =>
  mongo2PgLock.ensureTableExists(db ?? getSqlClientOrThrow(), true);

export const getCollectionLockType = async (collectionName: CollectionNameString): Promise<ReadWriteTargets> =>
  mongo2PgLock.getCollectionType(getSqlClientOrThrow(), collectionName);

export const setCollectionLockType = async (
  collectionName: CollectionNameString,
  read: ReadTarget,
  write: WriteTarget,
): Promise<void> =>
  mongo2PgLock.setCollectionType(getSqlClientOrThrow(), collectionName, read, write);

export const getMongo2PgLockSchema = () => mongo2PgLock.getSchemaQueries();
