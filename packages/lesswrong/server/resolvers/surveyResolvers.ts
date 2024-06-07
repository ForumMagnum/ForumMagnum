import {
  addGraphQLMutation,
  addGraphQLResolvers,
  addGraphQLSchema,
} from "@/lib/vulcan-lib";
import { createMutator, updateMutator } from "../vulcan-lib";
import SurveyQuestions from "@/lib/collections/surveyQuestions/collection";
import type { SurveyQuestionInfo } from "@/components/surveys/SurveyEditPage";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";

addGraphQLSchema(`
  input SurveyQuestionInfo {
    _id: String
    question: String!
    format: String!
  }
`);

type EditSurveyArgs = {
  surveyId: string,
  name: string,
  questions: SurveyQuestionInfo[],
}

addGraphQLResolvers({
  Mutation: {
    async editSurvey(
      _root: void,
      {surveyId, name, questions}: EditSurveyArgs,
      context: ResolverContext,
    ) {
      const {currentUser} = context;
      if (!currentUser?.isAdmin) {
        throw new Error("Permission denied");
      }

      if (!surveyId || !name || !questions?.length) {
        throw new Error("Missing parameters");
      }

      const survey = await context.repos.surveys.updateSurveyName(surveyId, name);

      const questionIds = filterNonnull(questions.map(({_id}) => _id));
      await context.repos.surveys.deleteOrphanedQuestions(surveyId, questionIds);

      const questionPromises = questions.map(({_id, question, format}, order) => {
        const data = {surveyId, question, format, order};
        if (_id) {
          return updateMutator({
            collection: SurveyQuestions,
            documentId: _id,
            set: data,
            validate: false,
          });
        } else {
          return createMutator({
            collection: SurveyQuestions,
            document: data,
            validate: false,
          });
        }
      });
      await Promise.all(questionPromises);

      return survey;
    },
  },
});

addGraphQLMutation("editSurvey(surveyId: String!, name: String!, questions: [SurveyQuestionInfo!]!): Survey");
