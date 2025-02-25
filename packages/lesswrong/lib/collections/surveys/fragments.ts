import { registerFragment } from "@/lib/vulcan-lib/fragments.ts";

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
