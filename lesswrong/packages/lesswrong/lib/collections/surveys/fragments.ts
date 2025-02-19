import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment SurveyMinimumInfo on Survey {
    _id
    name
    questions {
      ...SurveyQuestionMinimumInfo
    }
    createdAt
  }
`);
