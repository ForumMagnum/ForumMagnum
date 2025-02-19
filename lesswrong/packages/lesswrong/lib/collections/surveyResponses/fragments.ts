import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment SurveyResponseMinimumInfo on SurveyResponse {
    _id
    surveyId
    surveyScheduleId
    userId
    clientId
    response
  }
`);
