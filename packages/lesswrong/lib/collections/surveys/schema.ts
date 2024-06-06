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
    type: "[SurveyQuestion]",
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
    sqlResolver: ({field, join}) => join({
      table: "SurveyQuestions",
      type: "left",
      on: {
        surveyId: field("_id"),
      },
      resolver: (surveyQuestionsField) => surveyQuestionsField("*"),
    }),
  }),
};

export default schema;
