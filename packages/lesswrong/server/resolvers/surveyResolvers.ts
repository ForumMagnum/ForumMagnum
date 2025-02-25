import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "@/lib/vulcan-lib/graphql.ts";
import { createMutator, updateMutator } from "../vulcan-lib/mutators";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { hasSurveys } from "@/lib/betas";
import Surveys from "@/lib/collections/surveys/collection";
import SurveyQuestions from "@/lib/collections/surveyQuestions/collection";
import type { SurveyQuestionInfo } from "@/components/surveys/SurveyEditPage";
import type { SurveyScheduleWithSurvey } from "../repos/SurveySchedulesRepo";

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
  Query: {
    async CurrentFrontpageSurvey(
      _root: void,
      _args: void,
      {currentUser, clientId, req, repos: {surveySchedules}}: ResolverContext,
    ): Promise<SurveyScheduleWithSurvey | null> {
      if (!hasSurveys || !clientId) {
        return null;
      }

      const userAgent = req?.get("User-Agent");
      if (!userAgent || userAgent.indexOf("Mozilla") !== 0) {
        return null;
      }

      const survey = await surveySchedules.getCurrentFrontpageSurvey(
        currentUser,
        clientId,
      );
      if (survey) {
        void surveySchedules.assignClientToSurveySchedule(survey._id, clientId);
        return survey;
      }
      return null;
    },
  },
  Mutation: {
    async editSurvey(
      _root: void,
      {surveyId, name, questions}: EditSurveyArgs,
      context: ResolverContext,
    ): Promise<DbSurvey> {
      const {currentUser} = context;
      if (!currentUser?.isAdmin) {
        throw new Error("Permission denied");
      }

      if (!surveyId || !name || !questions?.length) {
        throw new Error("Missing parameters");
      }

      const {data: survey} = await updateMutator({
        collection: Surveys,
        documentId: surveyId,
        set: {name},
        currentUser,
        validate: false,
      });

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

addGraphQLQuery("CurrentFrontpageSurvey: SurveySchedule");
addGraphQLMutation("editSurvey(surveyId: String!, name: String!, questions: [SurveyQuestionInfo!]!): Survey");
