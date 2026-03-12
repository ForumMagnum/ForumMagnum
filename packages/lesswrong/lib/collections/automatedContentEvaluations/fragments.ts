import { gql } from "@/lib/generated/gql-codegen";

export const AutomatedContentEvaluationsFragment = gql(`
  fragment AutomatedContentEvaluationsFragment on AutomatedContentEvaluation {
    _id
    score
    sentenceScores {
      sentence
      score
    }
    aiChoice
    aiReasoning
    aiCoT
    pangramScore
    pangramMaxScore
    pangramPrediction
    pangramWindowScores {
      text
      score
      startIndex
      endIndex
    }
  }
`);
