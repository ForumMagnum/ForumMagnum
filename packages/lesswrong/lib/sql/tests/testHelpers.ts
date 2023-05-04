import { registerCollection } from "../../vulcan-lib/getCollection";
import Table from "../Table";
import Query from "../Query";

export type DbTestObject = {
  _id: string,
  a?: number,
  b?: string,
  c?: {
    d: {
      e: string,
    },
  },
  d?: string[],
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
      defaultValue: 3,
    },
    b: {
      type: String,
    },
    c: {
      type: Object,
    },
    d: {
      type: Array
    },
    'd.$': {
      type: String
    },
    schemaVersion: {
      type: Number,
    },
  },
} as unknown as CollectionBase<DbTestObject>;

export const testTable = Table.fromCollection<DbTestObject>(TestCollection);

testTable.addIndex({a: 1, b: 1});
testTable.addIndex({a: 1, "c.d": 1});
testTable.addIndex({a: 1, b: 1}, {unique: true});
testTable.addIndex({a: 1, b: 1}, {partialFilterExpression: {a: {$gt: 3}, b: "test"}});
testTable.addIndex({b: 1}, {collation: {locale: "en", strength: 2}});

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

export type SuccessResult = {
  expectedSql: string,
  expectedArgs: any[],
}

export type ErrorResult = {
  expectedError: string,
}

export type TestCase = {
  name: string,
  getQuery: () => Query<DbTestObject>,
} & (SuccessResult | ErrorResult);

export const runTestCases = (tests: TestCase[]) => {
  for (const test of tests) {
    it(test.name, () => {
      if ("expectedError" in test) {
        expect(test.getQuery).toThrowError(test.expectedError);
      } else {
        const query = test.getQuery();
        const {sql, args} = query.compile();
        const normalizedSql = normalizeWhitespace(sql);
        expect(normalizedSql).toBe(test.expectedSql);
        expect(args).toStrictEqual(test.expectedArgs);
      }
    });
  }
}
