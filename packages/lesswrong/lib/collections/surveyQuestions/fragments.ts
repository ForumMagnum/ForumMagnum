import { frag } from "@/lib/fragments/fragmentWrapper"

export const SurveyQuestionMinimumInfo = () => frag`
  fragment SurveyQuestionMinimumInfo on SurveyQuestion {
    _id
    question
    format
    order
  }
`
