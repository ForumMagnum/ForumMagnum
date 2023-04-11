import { MongoCollection } from "./mongoCollection";
import PgCollection from "./sql/PgCollection";
import {
  ReadTarget,
  WriteTarget,
  getCollectionLockType,
  setCollectionLockType,
} from "./mongo2PgLock";

/**
 * SwitchingCollection is a temporary utility class used to enable zero
 * downtime migrations from Mongo to Postgres by allowing us to switch
 * reading and writing on and off for MongoDB and Postgres in a
 * collection independant manner whilst the server is running.
 *
 * It doesn't implement BaseCollection or extend MongoCollection for
 * implementation reasons, but the expected usage is that it will be a
 * drop-in replacement for MongoCollection or PgCollection, simply by
 * casting `const collection = new SwitchingCollection(...) as unknown
 * as MongoCollection<T>`, for instance.
 */
class SwitchingCollection<T extends DbObject> {
  static readonly POLL_RATE_SECONDS = 1;
  static readonly readOperations = [
    "find",
    "findOne",
    "findOneArbitrary",
    "aggregate",
  ] as const;

  static readonly writeOperations = [
    "rawInsert",
    "rawUpdateOne",
    "rawUpdateMany",
    "rawRemove",
    "_ensureIndex",
  ] as const;

  static readonly rawReadOperations = [
    "indexes",
  ] as const;

  static readonly rawWriteOperations = [
    "bulkWrite",
    "findOneAndUpdate",
    "dropIndex",
    "updateOne",
    "updateMany",
  ] as const;

  private mongoCollection: MongoCollection<T>;
  private pgCollection: PgCollection<T>;
  private readTarget: ReadTarget;
  private writeTarget: WriteTarget;

  constructor(tableName: string, options?: {_suppressSameNameError?: boolean}) {
    this.mongoCollection = new MongoCollection(tableName, options);
    this.pgCollection = new PgCollection(tableName, options);
    this.readTarget = "mongo";
    this.writeTarget = "mongo";

    // Don't try this at home...
    return new Proxy(this, {
      get: (target: SwitchingCollection<T>, property: string): any => {
        if (property in target) {
          return (target as AnyBecauseTodo)[property];
        }

        if (SwitchingCollection.readOperations.includes(property as AnyBecauseTodo)) {
          return (this.getReadCollection() as AnyBecauseTodo)[property];
        }

        if (SwitchingCollection.writeOperations.includes(property as AnyBecauseTodo)) {
          return this.proxiedWrite(this.getWriteCollections(), property);
        }

        if (property === "rawCollection") {
          const targets = this.getWriteCollections().map(
            (collection) => collection.rawCollection(),
          );
          const result: AnyBecauseTodo = {};
          const rawRead = this.getReadCollection().rawCollection();
          for (const op of SwitchingCollection.rawReadOperations) {
            result[op] = rawRead[op];
          }
          for (const op of SwitchingCollection.rawWriteOperations) {
            result[op] = this.proxiedWrite(targets, op);
          }
          return () => result;
        }

        if (property === "options") {
          return new Proxy(this, {
            get: (target: SwitchingCollection<T>, property: string) => {
              const base = target.getReadCollection() as unknown as CollectionBase<T>;
              return (base.options as AnyBecauseTodo)[property];
            },

            set: (object: SwitchingCollection<T>, key: string, value: any): boolean => {
              (object.mongoCollection.options as AnyBecauseTodo)[key] = value;
              (object.pgCollection.options as AnyBecauseTodo)[key] = value;
              return true;
            },
          });
        }

        const base = target.getReadCollection() as unknown as CollectionBase<T>;
        return (base as AnyBecauseTodo)[property];
      },

      set: (object: SwitchingCollection<T>, key: string, value: any): boolean => {
        if (key in object) {
          (object as AnyBecauseTodo)[key] = value;
        } else {
          (object.mongoCollection as AnyBecauseTodo)[key] = value;
          (object.pgCollection as AnyBecauseTodo)[key] = value;
        }
        return true;
      },
    });
  }

  addDefaultView(view: Function) {
    this.mongoCollection.defaultView = view;
    this.pgCollection.defaultView = view;
  }

  addView(viewName: string, view: Function) {
    if (!this.mongoCollection.views) {
      this.mongoCollection.views = {};
    }
    if (!this.pgCollection.views) {
      this.pgCollection.views = {};
    }
    this.mongoCollection.views[viewName] = view;
    this.pgCollection.views[viewName] = view;
  }

  setTargets(readTarget: ReadTarget, writeTarget: WriteTarget) {
    this.readTarget = readTarget;
    this.writeTarget = writeTarget;
  }

  getReadTarget() {
    return this.readTarget;
  }

  getWriteTarget() {
    return this.writeTarget;
  }

  getReadCollection() {
    switch (this.readTarget) {
    case "mongo":
      return this.mongoCollection;
    case "pg":
      return this.pgCollection;
    default:
      throw new Error("Invalid read target");
    }
  }

  getWriteCollections() {
    switch (this.writeTarget) {
    case "mongo":
      return [this.mongoCollection];
    case "pg":
      return [this.pgCollection];
    case "both":
      return [this.mongoCollection, this.pgCollection];
    default:
      throw new Error("Invalid write target");
    }
  }

  proxiedWrite(targets: any[], operation: string) {
    return async (...args: any[]) => {
      const result = await Promise.all(
        targets.map((target) => target[operation](...args)),
      );
      return result[0];
    };
  }

  isPostgres() {
    return this.readTarget === "pg";
  }

  isConnected() {
    return this.mongoCollection.isConnected() && this.pgCollection.isConnected();
  }

  getTable() {
    return this.pgCollection.getTable();
  }

  getMongoCollection() {
    return this.mongoCollection;
  }

  setMongoCollection(mongoCollection: MongoCollection<T>) {
    this.mongoCollection = mongoCollection;
  }

  getPgCollection() {
    return this.pgCollection;
  }

  setPgCollection(pgCollection: PgCollection<T>) {
    this.pgCollection = pgCollection;
  }

  buildPostgresTable() {
    this.pgCollection.buildPostgresTable();
  }

  getName() {
    const base = this.mongoCollection as unknown as CollectionBase<DbObject>;
    return base.collectionName;
  }

  /**
   * For the sake of integrity, we maintain a single-source-of-truth for which
   * collections are using which database which is managed by server/mongo2PgLock.
   * This funciton saves the current read/write state to the lock table. The state
   * is read back by polling (see `startPolling`).
   */
  async writeToLock(): Promise<void> {
    const {collectionName} = this.mongoCollection.options as any;
    await setCollectionLockType(collectionName, this.readTarget, this.writeTarget);
  }

  /**
   * The production sites use multiple server instances. The Mongo to Postgres
   * migrations are run on remote dev machines, so we need a way to switch the
   * prod instances from Mongo to Postgres after migrations are complete. The
   * simplest way to do this is to regularly poll the lock table.
   *
   * The overhead from this is very small as the lock is a tiny table which we
   * are searching by primary key, and the network overhead is minimal as the
   * database and server instances are both in the same AWS region.
   */
  startPolling(): Promise<void> {
    const poll = async () => {
      const {collectionName} = this.mongoCollection.options as any;
      const {read, write} = await getCollectionLockType(collectionName);
      this.readTarget = read;
      this.writeTarget = write;
      setTimeout(poll, SwitchingCollection.POLL_RATE_SECONDS * 1000);
    }

    return poll();
  }
}

export default SwitchingCollection;
