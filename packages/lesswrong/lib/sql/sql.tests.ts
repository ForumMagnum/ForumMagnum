import { testStartup } from "../../testing/testMain";
import Table from "./Table";
import Query from "./Query";

testStartup();

const TestCollection = {
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
  },
} as unknown as CollectionBase<DbObject>;

const testTable = Table.fromCollection(TestCollection);

const normalizeWhitespace = (s: string) => s.replace(/\s+/g, " ");

describe("Query", () => {
  type TestCase = {
    name: string,
    getQuery: () => Query<DbObject>,
    expectedSql: string,
    expectedArgs: any[],
  };

  const tests: TestCase[] = [
    {
      name: "can build simple select query",
      getQuery: () => Query.select(testTable),
      expectedSql: 'SELECT * FROM "TestCollection"',
      expectedArgs: [],
    },
    {
      name: "can build simple count query",
      getQuery: () => Query.select(testTable, {}, {}, true),
      expectedSql: 'SELECT count(*) FROM "TestCollection"',
      expectedArgs: [],
    },
    {
      name: "can build select query with where clause",
      getQuery: () => Query.select(testTable, {a: 3}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build count query with where clause",
      getQuery: () => Query.select(testTable, {a: 3}, {}, true),
      expectedSql: 'SELECT count(*) FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with $and selector",
      getQuery: () => Query.select(testTable, {$and: {a: 3, b: "b"}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with implicit $and selector",
      getQuery: () => Query.select(testTable, {a: 3, b: "b"}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $or selector",
      getQuery: () => Query.select(testTable, {$or: {a: 3, b: "b"}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 OR "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with comparison against null",
      getQuery: () => Query.select(testTable, {a: null}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" IS NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with equal comparison",
      getQuery: () => Query.select(testTable, {a: {$eq: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with not-equal comparison",
      getQuery: () => Query.select(testTable, {a: {$ne: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" <> $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with less-than comparison",
      getQuery: () => Query.select(testTable, {a: {$lt: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" < $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with less-than-or-equal comparison",
      getQuery: () => Query.select(testTable, {a: {$lte: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" <= $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with greater-than comparison",
      getQuery: () => Query.select(testTable, {a: {$gt: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" > $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with greater-than-or-equal comparison",
      getQuery: () => Query.select(testTable, {a: {$gte: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" >= $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with in comparison",
      getQuery: () => Query.select(testTable, {a: {$in: [1, 2, 3]}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" IN $1',
      expectedArgs: [[1, 2, 3]],
    },
    {
      name: "can build select query with not-in comparison",
      getQuery: () => Query.select(testTable, {a: {$nin: [1, 2, 3]}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" NOT IN $1',
      expectedArgs: [[1, 2, 3]],
    },
    {
      name: "can build select query with json fields",
      getQuery: () => Query.select(testTable, {"c.d.e": 3}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ("c"->\'d\'->\'e\')::INTEGER = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with sort",
      getQuery: () => Query.select(testTable, {a: 3}, {sort: {b: -1}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC',
      expectedArgs: [3],
    },
    {
      name: "can build select query with limit",
      getQuery: () => Query.select(testTable, {a: 3}, {limit: 10}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1 LIMIT $2',
      expectedArgs: [3, 10],
    },
    {
      name: "can build select query with skip",
      getQuery: () => Query.select(testTable, {a: 3}, {skip: 10}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1 OFFSET $2',
      expectedArgs: [3, 10],
    },
    {
      name: "can build select query with multiple options",
      getQuery: () => Query.select(testTable, {a: 3}, {sort: {b: -1}, limit: 10, skip: 20}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC LIMIT $2 OFFSET $3',
      expectedArgs: [3, 10, 20],
    },
  ];

  for (const test of tests) {
    it(test.name, () => {
      const query = test.getQuery();
      const {sql, args} = query.compile();
      const normalizedSql = normalizeWhitespace(sql);
      expect(normalizedSql).toBe(test.expectedSql);
      expect(args).toStrictEqual(test.expectedArgs);
    });
  }
});
