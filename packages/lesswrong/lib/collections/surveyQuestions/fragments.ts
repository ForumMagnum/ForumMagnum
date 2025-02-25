import { registerFragment } from "@/lib/vulcan-lib/fragments.ts";

registerFragment(`
  fragment SurveyQuestionMinimumInfo on SurveyQuestion {
    _id
    question
    format
    order
  }
`);
