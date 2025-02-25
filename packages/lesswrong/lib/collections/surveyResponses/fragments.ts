import { registerFragment } from "@/lib/vulcan-lib/fragments.ts";

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
