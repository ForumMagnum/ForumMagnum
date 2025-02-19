import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment SurveyScheduleMinimumInfo on SurveySchedule {
    _id
    survey {
      ...SurveyMinimumInfo
    }
  }
`);

registerFragment(`
  fragment SurveyScheduleEdit on SurveySchedule {
    ...SurveyScheduleMinimumInfo
    surveyId
    name
    impressionsLimit
    maxVisitorPercentage
    minKarma
    maxKarma
    target
    startDate
    endDate
    deactivated
    createdAt
  }
`);
