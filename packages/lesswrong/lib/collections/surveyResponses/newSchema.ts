import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users/permissions.ts";

const userEditableField = ({
  nullable = false,
}: {
  nullable?: boolean;
} = {}): CollectionFieldSpecification<"SurveyResponses"> => ({
  canRead: [userOwns, "admins"],
  canCreate: ["guests"],
  canUpdate: [userOwns, "admins"],
  optional: nullable,
  nullable,
});

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
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  survey: {
    graphql: {
      outputType: "Survey",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Surveys", fieldName: "surveyId" }),
    },
  },
  surveyScheduleId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "SurveySchedules",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  surveySchedule: {
    graphql: {
      outputType: "SurveySchedule",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "SurveySchedules", fieldName: "surveyScheduleId" }),
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  clientId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ClientIds",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  client: {
    graphql: {
      outputType: "ClientId",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "ClientIds", fieldName: "clientId" }),
    },
  },
  response: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      inputType: "JSON!",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
      validation: {
        blackbox: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"SurveyResponses">>;

export default schema;
