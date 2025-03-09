import { foreignKeyField, resolverOnlyField } from "@/lib/utils/schemaUtils";

export const testSchema: SchemaType<CollectionNameString> = {
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
};

export const testSchema2: SchemaType<CollectionNameString> = {
  _id: {
    type: String,
  },
  data: {
    type: String,
  },
  schemaVersion: {
    type: Number,
  },
};

export const testSchema3: SchemaType<CollectionNameString> = {
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
};

export const testSchema4: SchemaType<CollectionNameString> = {
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
};

export const testSchemas = {
  TestCollection: testSchema,
  TestCollection2: testSchema2,
  TestCollection3: testSchema3,
  TestCollection4: testSchema4,
};
