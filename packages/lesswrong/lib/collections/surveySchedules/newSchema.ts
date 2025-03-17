// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { arrayOfForeignKeysOnCreate, generateIdResolverMulti, generateIdResolverSingle, getFillIfMissing } from "@/lib/utils/schemaUtils";

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

const schema: Record<string, NewCollectionFieldSpecification<"SurveySchedules">> = {
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
  surveyId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Surveys",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  survey: {
    graphql: {
      type: "Survey!",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "SurveySchedules", fieldName: "surveyId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  name: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "Float",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
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
      type: "Float",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
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
      type: "Float",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  maxKarma: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      type: "Float",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  target: {
    database: {
      type: "TEXT",
      defaultValue: "allUsers",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "Date",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
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
      type: "Date",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
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
      type: "Boolean",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
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
      type: "[String]",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  clients: {
    graphql: {
      type: "[ClientId!]!",
      canRead: ["admins"],
      resolver: generateIdResolverMulti({ collectionName: "SurveySchedules", fieldName: "clientIds" }),
    },
    form: {
      hidden: true,
    },
  },
};

export default schema;
