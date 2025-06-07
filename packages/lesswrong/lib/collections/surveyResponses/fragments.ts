import { gql } from "@/lib/crud/wrapGql";

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
