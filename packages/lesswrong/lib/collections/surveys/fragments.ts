import { frag } from "@/lib/fragments/fragmentWrapper"

export const SurveyMinimumInfo = () => frag`
  fragment SurveyMinimumInfo on Survey {
    _id
    name
    questions {
      ...SurveyQuestionMinimumInfo
    }
    createdAt
  }
`
