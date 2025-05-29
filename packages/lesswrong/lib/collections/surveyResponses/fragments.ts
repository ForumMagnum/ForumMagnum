import { frag } from "@/lib/fragments/fragmentWrapper"

export const SurveyResponseMinimumInfo = () => frag`
  fragment SurveyResponseMinimumInfo on SurveyResponse {
    _id
    surveyId
    surveyScheduleId
    userId
    clientId
    response
  }
`
