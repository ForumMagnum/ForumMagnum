import { getWithLoader } from "@/lib/loaders";
import { accessFilterMultiple, resolverOnlyField } from "@/lib/utils/schemaUtils";

const schema: SchemaType<"Surveys"> = {
  name: {
    type: String,
    optional: false,
    nullable: false,
    canRead: ["guests"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  questions: resolverOnlyField({
    type: Array,
    graphQLtype: "[SurveyQuestion]",
    canRead: ["guests"],
    resolver: async (survey: DbSurvey, _args: void, context: ResolverContext) => {
      const {currentUser, SurveyQuestions} = context;
      const questions = await getWithLoader(
        context,
        SurveyQuestions,
        "surveyQuestionsBySurvey",
        {surveyId: survey._id},
        "surveyId",
        survey._id,
      );
      return accessFilterMultiple(currentUser, SurveyQuestions, questions, context);
    },
    sqlResolver: ({field}) => `(
      SELECT ARRAY_AGG(ROW_TO_JSON(sq.*))
      FROM "SurveyQuestions" sq
      WHERE sq."surveyId" = ${field("_id")}
    )`,
  }),
  "questions.$": {
    type: "SurveyQuestion",
  },
};

export default schema;
