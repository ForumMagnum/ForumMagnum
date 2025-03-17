// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { getFillIfMissing } from "@/lib/utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"DebouncerEvents">> = {
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
  name: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
    },
  },
  af: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
    },
  },
  dispatched: {
    database: {
      type: "BOOL",
      nullable: false,
    },
    graphql: {
      type: "Boolean",
    },
  },
  failed: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
    },
  },
  delayTime: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
    },
  },
  upperBoundTime: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
    },
  },
  key: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
    },
  },
  pendingEvents: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      type: "[String]",
    },
  },
};

export default schema;
