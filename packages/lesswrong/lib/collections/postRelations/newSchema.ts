// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "../../utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"PostRelations">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  sourcePostId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  sourcePost: {
    graphql: {
      type: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        collectionName: "PostRelations",
        fieldName: "sourcePostId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
    },
  },
  targetPostId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  targetPost: {
    graphql: {
      type: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        collectionName: "PostRelations",
        fieldName: "targetPostId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
    },
  },
  order: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
};

export default schema;
