// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

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
      outputType: "Survey!",
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
