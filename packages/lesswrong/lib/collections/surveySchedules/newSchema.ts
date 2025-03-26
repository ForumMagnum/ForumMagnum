import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { arrayOfForeignKeysOnCreate, generateIdResolverMulti, generateIdResolverSingle } from "@/lib/utils/schemaUtils";

const commonFields = ({
  nullable = false,
}: {
  nullable?: boolean;
} = {}): CollectionFieldSpecification<"SurveySchedules"> => ({
  canRead: ["admins"],
  canCreate: ["admins"],
  canUpdate: ["admins"],
  optional: nullable,
  nullable,
});

const surveyScheduleTargets = [
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
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {},
  },
  survey: {
    graphql: {
      outputType: "Survey!",
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
    form: {
      label: "Schedule name",
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
    form: {
      min: 0,
      tooltip: "The maximum number of visitors who'll see this survey",
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
    form: {
      min: 0,
      max: 100,
      tooltip: "The maximum percentage of visitors this survey will be shown to",
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
    form: {},
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
    form: {},
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
    form: {
      form: { options: () => surveyScheduleTargets, hideClear: true },
      control: "select",
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
    form: {
      control: "datetime",
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
    form: {
      control: "datetime",
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
    form: {},
  },
  clientIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String]",
      inputType: "[String]!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
    form: {
      hidden: true,
    },
  },
  clients: {
    graphql: {
      outputType: "[ClientId!]!",
      canRead: ["admins"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "ClientIds", fieldName: "clientIds" }),
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"SurveySchedules">>;

export default schema;
