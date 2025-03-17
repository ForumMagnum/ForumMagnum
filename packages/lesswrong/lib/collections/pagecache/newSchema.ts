// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import SimpleSchema from "simpl-schema";
import { getFillIfMissing } from "@/lib/utils/schemaUtils";

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

const schema: Record<string, NewCollectionFieldSpecification<"PageCache">> = {
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
  path: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
    },
  },
  abTestGroups: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      type: "JSON",
    },
  },
  bundleHash: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
    },
  },
  renderedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
    },
  },
  expiresAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
    },
  },
  ttlMs: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      type: "Float",
    },
  },
  renderResult: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      type: "JSON",
      validation: {
        simpleSchema: FILL_THIS_IN,
      },
    },
  },
};

export default schema;
