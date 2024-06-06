import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment SurveyScheduleMinimumInfo on SurveySchedule {
    _id
    survey {
      ...SurveyMinimumInfo
    }
    name
    minKarma
    maxKarma
    target
    startDate
    endDate
    deactivated
  }
`);
