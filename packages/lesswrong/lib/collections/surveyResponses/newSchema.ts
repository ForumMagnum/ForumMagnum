// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "@/lib/utils/schemaUtils";
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

const schema: Record<string, NewCollectionFieldSpecification<"SurveyResponses">> = {
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
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  survey: {
    graphql: {
      type: "Survey!",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ collectionName: "SurveyResponses", fieldName: "surveyId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  surveyScheduleId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "SurveySchedules",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  surveySchedule: {
    graphql: {
      type: "SurveySchedule",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({
        collectionName: "SurveyResponses",
        fieldName: "surveyScheduleId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ collectionName: "SurveyResponses", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  clientId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ClientIds",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  client: {
    graphql: {
      type: "ClientId",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ collectionName: "SurveyResponses", fieldName: "clientId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  response: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
};

export default schema;
