import SwitchingCollection from "../lib/SwitchingCollection";
import { MongoCollection } from "../lib/mongoCollection";
import PgCollection from "../lib/sql/PgCollection";
import { createCollection } from '../lib/vulcan-lib';
import type { ReadTarget, WriteTarget } from "../lib/mongo2PgLock";

const createMockCollection = () => {
  const rawCollection = {
    bulkWrite: jest.fn(),
    findOneAndUpdate: jest.fn(),
    dropIndex: jest.fn(),
    indexes: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
  };
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneArbitrary: jest.fn(),
    aggregate: jest.fn(),
    rawInsert: jest.fn(),
    rawUpdateOne: jest.fn(),
    rawUpdateMany: jest.fn(),
    rawRemove: jest.fn(),
    _ensureIndex: jest.fn(),
    rawCollection: () => rawCollection,
  };
}

type MockCollection = ReturnType<typeof createMockCollection>;

type CheckCollection = MockCollection | ReturnType<MockCollection["rawCollection"]>;

const switchingCheckTestCase = (
  readTarget: ReadTarget,
  writeTarget: WriteTarget,
  readCheck: (mongo: CheckCollection, pg: CheckCollection, op: string) => void,
  writeCheck: (mongo: CheckCollection, pg: CheckCollection, op: string) => void,
) => {
  const mongoCollection = createMockCollection();
  const pgCollection = createMockCollection();
  const collection = new SwitchingCollection("test");
  collection.setMongoCollection(mongoCollection as unknown as MongoCollection<DbObject>);
  collection.setPgCollection(pgCollection as unknown as PgCollection<DbObject>);
  const base: AnyBecauseTodo = collection as unknown as CollectionBase<DbObject>;

  collection.setTargets(readTarget, writeTarget);
  for (const op of SwitchingCollection.readOperations) {
    it(`[read] ${op}`, async () => {
      await base[op]();
      readCheck(mongoCollection, pgCollection, op);
    });
  }
  for (const op of SwitchingCollection.writeOperations) {
    it(`[write] ${op}`, async () => {
      await base[op]();
      writeCheck(mongoCollection, pgCollection, op);
    });
  }

  const rawCollection = base.rawCollection();
  const rawMongo = mongoCollection.rawCollection();
  const rawPg = pgCollection.rawCollection();
  for (const op of SwitchingCollection.rawReadOperations) {
    it(`[raw read] ${op}`, async () => {
      await rawCollection[op]();
      readCheck(rawMongo, rawPg, op);
    });
  }
  for (const op of SwitchingCollection.rawWriteOperations) {
    it(`[raw write] ${op}`, async () => {
      await rawCollection[op]();
      writeCheck(rawMongo, rawPg, op);
    });
  }
}

describe("SwitchingCollection", () => {
  it("defaults to mongo", () => {
    const collection = new SwitchingCollection("test");
    expect(collection.getReadTarget()).toBe("mongo");
    expect(collection.getWriteTarget()).toBe("mongo");
  });
  it("properties are written to both sub-collections", () => {
    const collection = new SwitchingCollection("test");
    const mongoCollection = collection.getMongoCollection();
    const pgCollection = collection.getPgCollection();
    expect(mongoCollection).toBeInstanceOf(MongoCollection);
    expect(pgCollection).toBeInstanceOf(PgCollection);

    const base = collection as unknown as MongoCollection<DbPost>;
    base.table = 3;
    expect(mongoCollection.table).toBe(3);
    expect(pgCollection.table).toBe(3);
  });
  it("can set defaultView", () => {
    const collection = new SwitchingCollection("test");
    const mongoCollection = collection.getMongoCollection();
    const pgCollection = collection.getPgCollection();
    expect(mongoCollection).toBeInstanceOf(MongoCollection);
    expect(pgCollection).toBeInstanceOf(PgCollection);

    const view = (_terms: any) => ({selector: {}});
    (collection as unknown as CollectionBase<DbObject>).addDefaultView(view);

    expect((collection as any).defaultView).toBe(view);
    expect(mongoCollection.defaultView).toBe(view);
    expect(pgCollection.defaultView).toBe(view);
  });
  it("can add views", () => {
    const collection = new SwitchingCollection("test");
    const mongoCollection = collection.getMongoCollection();
    const pgCollection = collection.getPgCollection();
    expect(mongoCollection).toBeInstanceOf(MongoCollection);
    expect(pgCollection).toBeInstanceOf(PgCollection);

    const viewName = "some-view";
    const view = (_terms: any) => ({selector: {}});
    (collection as unknown as CollectionBase<DbObject>).addView(viewName, view);

    expect((collection as any).views[viewName]).toBe(view);
    expect(mongoCollection.views[viewName]).toBe(view);
    expect(pgCollection.views[viewName]).toBe(view);
  });
  it("passes arguments through `proxiedWrite`", async () => {
    const collection = new SwitchingCollection("test");
    const mockCollection1 = {
      testFunction: jest.fn(() => 1),
    };
    const mockCollection2 = {
      testFunction: jest.fn(() => 2),
    };
    const writer = collection.proxiedWrite([mockCollection1, mockCollection2], "testFunction");
    const result = await writer("testArgument", 1, 2, 3);
    expect(mockCollection1.testFunction).toHaveBeenCalledWith("testArgument", 1, 2, 3);
    expect(mockCollection2.testFunction).toHaveBeenCalledWith("testArgument", 1, 2, 3);
    expect(result).toBe(1);
  });
  it("can retrieve sub-collections", () => {
    const collection = new SwitchingCollection("test");

    collection.setTargets("mongo", "pg");
    expect(collection.getReadCollection()).toBeInstanceOf(MongoCollection);
    let writeCollections = collection.getWriteCollections();
    expect(writeCollections).toHaveLength(1);
    expect(writeCollections[0]).toBeInstanceOf(PgCollection);

    collection.setTargets("pg", "mongo");
    expect(collection.getReadCollection()).toBeInstanceOf(PgCollection);
    writeCollections = collection.getWriteCollections();
    expect(writeCollections).toHaveLength(1);
    expect(writeCollections[0]).toBeInstanceOf(MongoCollection);

    collection.setTargets("pg", "both");
    expect(collection.getReadCollection()).toBeInstanceOf(PgCollection);
    writeCollections = collection.getWriteCollections();
    expect(writeCollections).toHaveLength(2);
    expect(writeCollections[0]).toBeInstanceOf(MongoCollection);
    expect(writeCollections[1]).toBeInstanceOf(PgCollection);
  });
  it("can get and set options", () => {
    const collection = new SwitchingCollection("test");
    const mongoCollection = collection.getMongoCollection();
    const pgCollection = collection.getPgCollection();

    const base = collection as unknown as CollectionBase<DbObject>;
    const mongoBase = mongoCollection as unknown as CollectionBase<DbObject>;
    const pgBase = pgCollection as unknown as CollectionBase<DbObject>;

    expect(base.options.typeName).toBe(undefined);
    expect(mongoBase.options.typeName).toBe(undefined);
    expect(pgBase.options.typeName).toBe(undefined);

    base.options.typeName = "test";
    expect(base.options.typeName).toBe("test");
    expect(mongoBase.options.typeName).toBe("test");
    expect(pgBase.options.typeName).toBe("test");
  });
  describe("read: mongo - write: mongo", switchingCheckTestCase.bind(
    null,
    "mongo",
    "mongo",
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).toHaveBeenCalled();
      expect(pgCollection[op]).not.toHaveBeenCalled();
    },
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).toHaveBeenCalled();
      expect(pgCollection[op]).not.toHaveBeenCalled();
    },
  ));
  describe("read: mongo - write: pg", switchingCheckTestCase.bind(
    null,
    "mongo",
    "pg",
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).toHaveBeenCalled();
      expect(pgCollection[op]).not.toHaveBeenCalled();
    },
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).not.toHaveBeenCalled();
      expect(pgCollection[op]).toHaveBeenCalled();
    },
  ));
  describe("read: pg - write: mongo", switchingCheckTestCase.bind(
    null,
    "pg",
    "mongo",
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).not.toHaveBeenCalled();
      expect(pgCollection[op]).toHaveBeenCalled();
    },
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).toHaveBeenCalled();
      expect(pgCollection[op]).not.toHaveBeenCalled();
    },
  ));
  describe("read: pg - write: pg", switchingCheckTestCase.bind(
    null,
    "pg",
    "pg",
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).not.toHaveBeenCalled();
      expect(pgCollection[op]).toHaveBeenCalled();
    },
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).not.toHaveBeenCalled();
      expect(pgCollection[op]).toHaveBeenCalled();
    },
  ));
  describe("read: mongo - write: both", switchingCheckTestCase.bind(
    null,
    "mongo",
    "both",
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).toHaveBeenCalled();
      expect(pgCollection[op]).not.toHaveBeenCalled();
    },
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).toHaveBeenCalled();
      expect(pgCollection[op]).toHaveBeenCalled();
    },
  ));
  describe("read: pg - write: both", switchingCheckTestCase.bind(
    null,
    "pg",
    "both",
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).not.toHaveBeenCalled();
      expect(pgCollection[op]).toHaveBeenCalled();
    },
    (mongoCollection: AnyBecauseTodo, pgCollection: AnyBecauseTodo, op: AnyBecauseTodo) => {
      expect(mongoCollection[op]).toHaveBeenCalled();
      expect(pgCollection[op]).toHaveBeenCalled();
    },
  ));
  describe("can create collection", () => {
    const schema: SchemaType<DbRSSFeed> = {
      status: {
        type: String,
        canRead: ['guests'],
        canUpdate: ['admins'],
        optional: true,
      },
    };

    const collection: SwitchingCollection<DbRSSFeed> = createCollection({
      collectionName: 'RSSFeeds',
      typeName: 'RSSFeed',
      collectionType: 'switching',
      schema,
    });

    expect(collection).toBeInstanceOf(SwitchingCollection);
    expect(collection.getMongoCollection()).toBeInstanceOf(MongoCollection);
    expect(collection.getPgCollection()).toBeInstanceOf(PgCollection);

    const checkCollection = (collection: CollectionBase<DbObject>) => {
      expect(collection.typeName).toBe("RSSFeed");
      expect(collection.options.typeName).toBe("RSSFeed");
      expect(collection.options.singleResolverName).toBe("rSSFeed");
      expect(collection.options.multiResolverName).toBe("rSSFeeds");
      expect(collection.collectionName).toBe("RSSFeeds");
      expect(collection.options.collectionName).toBe("RSSFeeds");
    }

    checkCollection(collection as unknown as CollectionBase<DbObject>);
    checkCollection(collection.getMongoCollection() as unknown as CollectionBase<DbObject>);
    checkCollection(collection.getPgCollection() as unknown as CollectionBase<DbObject>);
  });
});
