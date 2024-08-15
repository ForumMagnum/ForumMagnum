import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment SurveyQuestionMinimumInfo on SurveyQuestion {
    _id
    question
    format
    order
  }
`);
