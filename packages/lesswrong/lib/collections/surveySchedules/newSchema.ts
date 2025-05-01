import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { arrayOfForeignKeysOnCreate, generateIdResolverMulti, generateIdResolverSingle } from "@/lib/utils/schemaUtils";

export const surveyScheduleTargets = [
  { value: "allUsers", label: "All users" },
  { value: "loggedInOnly", label: "Logged-in users only" },
  { value: "loggedOutOnly", label: "Logged-out users only" },
] as const;

export type SurveyScheduleTarget = (typeof surveyScheduleTargets)[number]["value"];

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  surveyId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Surveys",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  survey: {
    graphql: {
      outputType: "Survey",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Surveys", fieldName: "surveyId" }),
    },
  },
  name: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  impressionsLimit: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  maxVisitorPercentage: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  minKarma: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  maxKarma: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  target: {
    database: {
      type: "TEXT",
      defaultValue: "allUsers",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        allowedValues: ["allUsers", "loggedInOnly", "loggedOutOnly"],
      },
    },
  },
  startDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  endDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  deactivated: {
    database: {
      type: "BOOL",
      defaultValue: false,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  clientIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]",
      inputType: "[String!]",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  clients: {
    graphql: {
      outputType: "[ClientId!]",
      canRead: ["admins"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "ClientIds", fieldName: "clientIds" }),
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"SurveySchedules">>;

export default schema;
