import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";

const dictionaryToSelectOptions = <T extends Record<string, string>>(dictionary: T) => {
  return Object.entries(dictionary).map(([value, label]) => ({ value, label }));
};

export const USER_RATE_LIMIT_TYPES = {
  allComments: "Comments",
  allPosts: "Posts",
};

const INTERVAL_UNITS = {
  minutes: "minutes",
  hours: "hours",
  days: "days",
  weeks: "weeks",
};

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {
      hidden: true,
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        allowedValues: ["allComments", "allPosts"],
      },
    },
    form: {
      options: () => dictionaryToSelectOptions(USER_RATE_LIMIT_TYPES),
      control: "select",
    },
  },
  intervalUnit: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        allowedValues: ["minutes", "hours", "days", "weeks"],
      },
    },
    form: {
      options: () => dictionaryToSelectOptions(INTERVAL_UNITS),
      control: "select",
    },
  },
  intervalLength: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      inputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {},
  },
  actionsPerInterval: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      inputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {},
  },
  endedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "datetime",
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"UserRateLimits">>;

export default schema;
