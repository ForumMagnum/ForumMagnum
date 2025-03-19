// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import SimpleSchema from "simpl-schema";

// export type RenderResult = {
//   ssrBody: string
//   headers: Array<string>
//   serializedApolloState: string
//   serializedForeignApolloState: string
//   jssSheets: string
//   status: number|undefined,
//   redirectUrl: string|undefined
//   relevantAbTestGroups: RelevantTestGroupAllocation
//   allAbTestGroups: CompleteTestGroupAllocation
//   themeOptions: AbstractThemeOptions,
//   renderedAt: Date,
//   cacheFriendly: boolean,
//   timezone: string,
//   timings: RenderTimings,
//   aborted: false,
// } | {
//   aborted: true
// }
const RenderResultSchemaType = new SimpleSchema({
  ssrBody: {
    type: String,
  },
  headers: {
    type: Array,
  },
  "headers.$": {
    type: String,
  },
  serializedApolloState: {
    type: String,
  },
  serializedForeignApolloState: {
    type: String,
  },
  jssSheets: {
    type: String,
  },
  status: {
    type: Number,
    optional: true,
  },
  redirectUrl: {
    type: String,
    optional: true,
  },
  relevantAbTestGroups: {
    type: Object,
    blackbox: true,
  },
  allAbTestGroups: {
    type: Object,
    blackbox: true,
  },
  themeOptions: {
    type: Object,
    blackbox: true,
  },
  renderedAt: {
    type: Date,
  },
  cacheFriendly: {
    type: Boolean,
  },
  timezone: {
    type: String,
  },
  timings: {
    type: Object,
    blackbox: true,
  },
});

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
      },
    },
  },
  path: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  abTestGroups: {
    database: {
      type: "JSONB",
      nullable: false,
    },
  },
  bundleHash: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  renderedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  expiresAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  ttlMs: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
  },
  renderResult: {
    database: {
      type: "JSONB",
      nullable: false,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"PageCache">>;

export default schema;
