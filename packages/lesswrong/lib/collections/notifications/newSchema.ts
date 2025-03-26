import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "../../vulcan-users/permissions";

export type NotificationCountsResult = {
  checkedAt: Date,
  unreadNotifications: number
  unreadPrivateMessages: number
  faviconBadgeNumber: number
};

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: {
    database: DEFAULT_CREATED_AT_FIELD.database,
    graphql: {
      ...DEFAULT_CREATED_AT_FIELD.graphql,
      canRead: [userOwns],
    },
  },
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns],
      validation: {
        optional: true,
      },
    },
  },
  documentId: {
    // No explicit foreign-key relation because which collection this is depends on notification type
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns],
      validation: {
        optional: true,
      },
    },
  },
  documentType: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns],
      validation: {
        optional: true,
      },
    },
  },
  extraData: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  link: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns],
      validation: {
        optional: true,
      },
    },
  },
  title: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns],
      validation: {
        optional: true,
      },
    },
  },
  message: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns],
      validation: {
        optional: true,
      },
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns],
      validation: {
        optional: true,
      },
    },
  },
  deleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns],
      validation: {
        optional: true,
      },
    },
  },
  viewed: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  emailed: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: [userOwns],
    },
  },
  waitingForBatch: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: [userOwns],
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Notifications">>;

export default schema;
