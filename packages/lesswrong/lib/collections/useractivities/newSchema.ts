// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.


const schema = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      onUpdate: () => 1,
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  visitorId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    // This is here purely for the type codegen output;
    // if/when we get rid of SimpleSchema, we can get rid of this
    graphql: {
      outputType: "String",
      canRead: [],
      validation: {
        allowedValues: ["userId", "clientId"],
      }
    }
  },
  startDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  endDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  activityArray: {
    database: {
      // In practice this is currently a boolean, but we could support weighting by how long exactly they were active for
      type: "DOUBLE PRECISION[]",
      nullable: false,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"UserActivities">>;

export default schema;
