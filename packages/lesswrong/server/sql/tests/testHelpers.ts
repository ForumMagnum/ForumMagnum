import { registerCollection } from "@/lib/vulcan-lib/getCollection";
import Table from "../Table";
import Query from "../Query";
import { foreignKeyField, resolverOnlyField } from "@/lib/utils/schemaUtils";
import { registerFragment } from "@/lib/vulcan-lib/fragments.ts";

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
  typeName: "TestCollection",
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
} as unknown as CollectionBase<CollectionNameString>;

export const testTable = Table.fromCollection<CollectionNameString, DbTestObject>(TestCollection);
(TestCollection as any).getTable = () => testTable;
registerCollection(TestCollection);

testTable.addIndex({a: 1, b: 1});
testTable.addIndex({a: 1, "c.d": 1});
testTable.addIndex({a: 1, b: 1}, {unique: true});
testTable.addIndex({a: 1, b: 1}, {partialFilterExpression: {a: {$gt: 3}, b: "test"}});
testTable.addIndex({b: 1}, {collation: {locale: "en", strength: 2}});
testTable.addIndex({a: 1, c: 1}, {concurrently: true});

export type DbTestObject2 = {
  _id: string,
  data?: number,
  schemaVersion: number,
}

export const TestCollection2 = {
  collectionName: "TestCollection2",
  typeName: "TestCollection2",
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
} as unknown as CollectionBase<CollectionNameString>;

registerFragment(`
  fragment TestCollection2DefaultFragment on TestCollection2 {
    _id
    data
  }
`);

export const testTable2 = Table.fromCollection<CollectionNameString, DbTestObject2>(TestCollection2);
(TestCollection2 as any).getTable = () => testTable2;
registerCollection(TestCollection2);

export type DbTestObject3 = {
  _id: string,
  notNullData: string,
  schemaVersion: number
};

export const TestCollection3 = {
  collectionName: "TestCollection3",
  typeName: "TestCollection3",
  _schemaFields: {
    _id: {
      type: String,
    },
    notNullData: {
      type: String,
      nullable: false
    },
    schemaVersion: {
      type: Number,
    }
  }
} as unknown as CollectionBase<CollectionNameString>;

export const testTable3 = Table.fromCollection<CollectionNameString, DbTestObject3>(TestCollection3);
(TestCollection3 as any).getTable = () => testTable3;
registerCollection(TestCollection3);

registerFragment(`
  fragment TestCollection3DefaultFragment on TestCollection3 {
    _id
    notNullData
  }
`);

export type DbTestObject4 = {
  _id: string,
  testCollection3Id: string,
  schemaVersion: number
};

export const TestCollection4 = {
  collectionName: "TestCollection4",
  typeName: "TestCollection4",
  _schemaFields: {
    _id: {
      type: String,
    },
    testCollection3Id: {
      ...foreignKeyField({
        idFieldName: "testCollection3Id",
        resolverName: "testCollection3",
        collectionName: "TestCollection3" as CollectionNameString,
        type: "TestCollection3",
        nullable: true,
        autoJoin: true,
      }),
    },
    testCollection2: resolverOnlyField({
      type: "TestCollection2",
      graphQLtype: "TestCollection2",
      graphqlArguments: "testCollection2Id: String",
      resolver: async () => null,
      sqlResolver: ({resolverArg, join}) => join({
        table: "TestCollection2" as CollectionNameString,
        type: "left",
        on: {
          _id: resolverArg("testCollection2Id"),
        },
        resolver: (testCollection2Field) => testCollection2Field("*"),
      }),
    }),
    schemaVersion: {
      type: Number,
    },
  },
} as unknown as CollectionBase<CollectionNameString>;

export const testTable4 = Table.fromCollection<CollectionNameString, DbTestObject4>(TestCollection4);
(TestCollection4 as any).getTable = () => testTable4;
registerCollection(TestCollection4);

registerFragment(`
  fragment TestCollection4DefaultFragment on TestCollection4 {
    _id
    testCollection3Id
    testCollection3 {
      ...TestCollection3DefaultFragment
    }
  }
`);

registerFragment(`
  fragment TestCollection4ArgFragment on TestCollection4 {
    _id
    testCollection2(testCollection2Id: $testCollection2Id) {
      ...TestCollection2DefaultFragment
    }
  }
`);

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
        const normalizedExpectedSql = normalizeWhitespace(test.expectedSql);
        expect(normalizedSql).toBe(normalizedExpectedSql);
        expect(args).toStrictEqual(test.expectedArgs);
      }
    });
  }
}
