import { gql } from "@/lib/generated/gql-codegen";

export const SurveyResponseMinimumInfo = gql(`
  fragment SurveyResponseMinimumInfo on SurveyResponse {
    _id
    surveyId
    surveyScheduleId
    userId
    clientId
    response
  }
`)
