import { frag } from "@/lib/fragments/fragmentWrapper"

export const SurveyMinimumInfo = () => gql`
  fragment SurveyMinimumInfo on Survey {
    _id
    name
    questions {
      ...SurveyQuestionMinimumInfo
    }
    createdAt
  }
`
