import { getSqlClient } from "@/server/sql/sqlClient";
import PgCollection from "@/server/sql/PgCollection";

/**
 * abstractRepo provides the superclass from which all of our collection
 * repositories are descended. Any common properties or functions
 * should be added here.
 *
 * To make the repo available in GraphQL resolvers, add it to `allRepos`
 * in index.ts
 */
export default abstract class AbstractRepo<N extends CollectionNameString> {
  protected collection: PgCollection<N>;
  private db: SqlClient;

  constructor(collection: CollectionBase<N>, sqlClient?: SqlClient) {
    if (!(collection instanceof PgCollection)) {
      throw new Error(`${collection.collectionName} is not a Postgres collection`);
    }
    this.collection = collection;
    const db = sqlClient ?? getSqlClient();
    if (db) {
      this.db = db;
    } else {
      throw new Error("Instantiating repo without a SQL client");
    }
  }

  protected getCollection(): PgCollection<N> {
    return this.collection;
  }

  /**
   * For queries that return type T (eg; a query in PostsRepo returning a DbPost or
   * DbPost[]) we should use this.one, this.many, this.any, etc. below as we can apply
   * automatic post-processing and there's more type safety. Some queries, however,
   * return different specialized types (such as CommentKarmaChanges) which should
   * instead use this.getRawDb().one, this.getRawDb().many, etc.
   */
  protected getRawDb(): SqlClient {
    return this.db;
  }

  protected none(sql: string, args: SqlQueryArgs = []): Promise<null> {
    return this.db.none(sql, args, () => `${sql}: ${JSON.stringify(args)}`);
  }

  protected one(sql: string, args: SqlQueryArgs = []): Promise<ObjectsByCollectionName[N]> {
    return this.postProcess(this.db.one(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  protected oneOrNone(sql: string, args: SqlQueryArgs = []): Promise<ObjectsByCollectionName[N] | null> {
    return this.postProcess(this.db.oneOrNone(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  protected any(sql: string, args: SqlQueryArgs = []): Promise<ObjectsByCollectionName[N][]> {
    return this.postProcess(this.db.any(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  protected many(sql: string, args: SqlQueryArgs = []): Promise<ObjectsByCollectionName[N][]> {
    return this.postProcess(this.db.many(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  protected manyOrNone(sql: string, args: SqlQueryArgs = []): Promise<ObjectsByCollectionName[N][]> {
    return this.postProcess(this.db.manyOrNone(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  private postProcess(promise: Promise<ObjectsByCollectionName[N]>): Promise<ObjectsByCollectionName[N]>;
  private postProcess(promise: Promise<ObjectsByCollectionName[N] | null>): Promise<ObjectsByCollectionName[N] | null>;
  private postProcess(promise: Promise<ObjectsByCollectionName[N][]>): Promise<ObjectsByCollectionName[N][]>;
  private postProcess(promise: Promise<ObjectsByCollectionName[N][] | null>): Promise<ObjectsByCollectionName[N][] | null>;
  private async postProcess(
    promise: Promise<ObjectsByCollectionName[N] | ObjectsByCollectionName[N][] | null>,
  ): Promise<ObjectsByCollectionName[N] | ObjectsByCollectionName[N][] | null> {
    const data = await promise;
    const {postProcess} = this.getCollection();
    if (data && postProcess) {
      return Array.isArray(data)
        ? data.map((item) => postProcess(item))
        : postProcess(data);
    }
    return data;
  }
}
