import { frag } from "@/lib/fragments/fragmentWrapper"

export const SurveyResponseMinimumInfo = () => gql`
  fragment SurveyResponseMinimumInfo on SurveyResponse {
    _id
    surveyId
    surveyScheduleId
    userId
    clientId
    response
  }
`
