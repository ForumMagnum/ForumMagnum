import { gql } from "@/lib/generated/gql-codegen/gql";

export const SurveyResponseMinimumInfo = () => gql(`
  fragment SurveyResponseMinimumInfo on SurveyResponse {
    _id
    surveyId
    surveyScheduleId
    userId
    clientId
    response
  }
`)
