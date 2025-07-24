import { gql } from "@/lib/generated/gql-codegen";

export const AutomatedContentEvaluations = gql(`
  fragment AutomatedContentEvaluations on AutomatedContentEvaluation {
    _id
    score
    sentenceScores {
      sentence
      score
    }
    aiChoice
    aiReasoning
    aiCoT
  }
`)