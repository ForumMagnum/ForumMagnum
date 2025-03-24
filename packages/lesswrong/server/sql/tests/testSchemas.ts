import { DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle, getForeignKeySqlResolver } from "@/lib/utils/schemaUtils";

export const testSchema: NewSchemaType<CollectionNameString> = {
  _id: DEFAULT_ID_FIELD,
  a: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 3,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
    },
  },
  b: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  c: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
    },
  },
  d: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      outputType: "[String]",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
    },
  },
};

export const testSchema2: NewSchemaType<CollectionNameString> = {
  _id: DEFAULT_ID_FIELD,
  data: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
    },
  },
};

export const testSchema3: NewSchemaType<CollectionNameString> = {
  _id: DEFAULT_ID_FIELD,
  notNullData: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
    },
  }
};

export const testSchema4: NewSchemaType<CollectionNameString> = {
  _id: DEFAULT_ID_FIELD,
  testCollection3Id: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "TestCollection3" as CollectionNameString,
    },
    graphql: {
      outputType: "TestCollection3",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  testCollection3: {
    graphql: {
      outputType: "TestCollection3",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        foreignCollectionName: "TestCollection3" as CollectionNameString,
        fieldName: "testCollection3Id",
        nullable: true,
      }),
      sqlResolver: getForeignKeySqlResolver({
        collectionName: "TestCollection3" as CollectionNameString,
        nullable: true,
        idFieldName: "testCollection3Id",
      }),
    },
  },
  testCollection2: {
    graphql: {
      outputType: "TestCollection2",
      canRead: ["guests"],
      resolver: async () => null,
      sqlResolver: ({ resolverArg, join }) => join({
        table: "TestCollection2" as CollectionNameString,
        type: "left",
        on: {
          _id: resolverArg("testCollection2Id"),
        },
        resolver: (testCollection2Field) => testCollection2Field("*"),
      }),
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
    },
  },
};

export const testSchema5: NewSchemaType<CollectionNameString> = {
  _id: DEFAULT_ID_FIELD,
  jsonField: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
    },
  },
};

export const testSchemas = {
  TestCollection: testSchema,
  TestCollection2: testSchema2,
  TestCollection3: testSchema3,
  TestCollection4: testSchema4,
  TestCollection5: testSchema5,
};
