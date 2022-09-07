import Table from "./Table";
import Query from "./Query";
import { registerCollection } from "../vulcan-lib/getCollection";

export type DbTestObject = {
  _id: string,
  a?: number,
  b?: string,
  c?: {
    d: {
      e: string,
    },
  },
  schemaVersion: number,
}

export const TestCollection = {
  collectionName: "TestCollection",
  _schemaFields: {
    _id: {
      type: String,
    },
    a: {
      type: Number,
    },
    b: {
      type: String,
    },
    c: {
      type: Object,
    },
    schemaVersion: {
      type: Number,
    },
  },
} as unknown as CollectionBase<DbTestObject>;

export const testTable = Table.fromCollection(TestCollection);

testTable.addIndex(["a", "b"]);
testTable.addIndex(["a", "c.d"]);
// TestCollection._ensureIndex({a: 1, b: 1});
// TestCollection._ensureIndex({a: 1, "c.d": 1});

export type DbTestObject2 = {
  _id: string,
  data?: number,
  schemaVersion: number,
}

export const TestCollection2 = {
  collectionName: "TestCollection2",
  _schemaFields: {
    _id: {
      type: String,
    },
    data: {
      type: String,
    },
    schemaVersion: {
      type: Number,
    },
  },
} as unknown as CollectionBase<DbTestObject2>;

export const testTable2 = Table.fromCollection(TestCollection2);

registerCollection(TestCollection);
registerCollection(TestCollection2);

export const normalizeWhitespace = (s: string) => s.trim().replace(/\s+/g, " ");

export type TestCase = {
  name: string,
  getQuery: () => Query<DbTestObject>,
  expectedSql: string,
  expectedArgs: any[],
};

export const runTestCases = (tests: TestCase[]) => {
  for (const test of tests) {
    it(test.name, () => {
      const query = test.getQuery();
      const {sql, args} = query.compile();
      const normalizedSql = normalizeWhitespace(sql);
      expect(normalizedSql).toBe(test.expectedSql);
      expect(args).toStrictEqual(test.expectedArgs);
    });
  }
}
