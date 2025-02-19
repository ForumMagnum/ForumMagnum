import { foreignKeyField } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users";

const userEditableField = ({nullable = false}: {
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
    ...userEditableField(),
    ...foreignKeyField({
      idFieldName: "surveyId",
      resolverName: "survey",
      collectionName: "Surveys",
      type: "Survey",
      nullable: false,
    }),
  },
  surveyScheduleId: {
    ...userEditableField(),
    ...foreignKeyField({
      idFieldName: "surveyScheduleId",
      resolverName: "surveySchedule",
      collectionName: "SurveySchedules",
      type: "SurveySchedule",
      nullable: true,
    }),
  },
  userId: {
    ...userEditableField(),
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
  },
  clientId: {
    ...userEditableField(),
    ...foreignKeyField({
      idFieldName: "clientId",
      resolverName: "client",
      collectionName: "ClientIds",
      type: "ClientId",
      nullable: true,
    }),
  },
  response: {
    ...userEditableField(),
    type: Object,
    blackbox: true,
  },
};

export default schema;
