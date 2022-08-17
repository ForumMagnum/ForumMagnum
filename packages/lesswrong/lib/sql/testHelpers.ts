import Table from "./Table";
import Query from "./Query";

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

export const normalizeWhitespace = (s: string) => s.replace(/\s+/g, " ");

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
