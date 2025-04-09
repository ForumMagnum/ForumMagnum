import { gql } from "@/lib/generated/gql-codegen/gql";

export const SurveyQuestionMinimumInfo = () => gql(`
  fragment SurveyQuestionMinimumInfo on SurveyQuestion {
    _id
    question
    format
    order
  }
`)
