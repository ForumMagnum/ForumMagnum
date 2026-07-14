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
    pangramApiVersion
    pangramScore
    pangramFractionAi
    pangramFractionAiAssisted
    pangramFractionHuman
    pangramMaxScore
    pangramPrediction
    pangramWindowScores {
      text
      score
      startIndex
      endIndex
      label
      confidence
      wordCount
    }
  }
`);
