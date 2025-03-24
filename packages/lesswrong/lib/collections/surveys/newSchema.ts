// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { getWithLoader } from "@/lib/loaders";
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  name: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  questions: {
    graphql: {
      outputType: "[SurveyQuestion!]!",
      canRead: ["guests"],
      resolver: async (survey, _args, context) => {
        const { currentUser, SurveyQuestions } = context;
        const questions = await getWithLoader(
          context,
          SurveyQuestions,
          "surveyQuestionsBySurvey",
          {
            surveyId: survey._id,
          },
          "surveyId",
          survey._id
        );
        const ordered = questions.sort((a, b) => a.order - b.order);
        return accessFilterMultiple(currentUser, "SurveyQuestions", ordered, context);
      },
      sqlResolver: ({ field }) => `(
      SELECT ARRAY_AGG(ROW_TO_JSON(sq.*))
      FROM "SurveyQuestions" sq
      WHERE sq."surveyId" = ${field("_id")}
      GROUP BY sq."order"
      ORDER BY sq."order" DESC
      LIMIT 1
    )`,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Surveys">>;

export default schema;
