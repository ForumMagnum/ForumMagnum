import { foreignKeyField } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users";

const commonFields = ({nullable = false}: {
  nullable?: boolean,
} = {}): CollectionFieldSpecification<"SurveyResponses"> => ({
  canRead: [userOwns, "admins"],
  canCreate: ["guests"],
  canUpdate: [userOwns, "admins"],
  optional: nullable,
  nullable,
});

const schema: SchemaType<"SurveyResponses"> = {
  surveyId: {
    ...commonFields(),
    ...foreignKeyField({
      idFieldName: "surveyId",
      resolverName: "survey",
      collectionName: "Surveys",
      type: "Survey",
      nullable: false,
    }),
  },
  userId: {
    ...commonFields(),
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
  },
  clientId: {
    ...commonFields(),
    ...foreignKeyField({
      idFieldName: "clientId",
      resolverName: "client",
      collectionName: "ClientIds",
      type: "ClientId",
      nullable: true,
    }),
  },
  response: {
    ...commonFields(),
    type: Object,
    blackbox: true,
  },
};

export default schema;
