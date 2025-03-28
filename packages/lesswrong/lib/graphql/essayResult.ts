

import { gql } from 'apollo-server';

export const essayResultSchema = gql`
  type EssayResult {
    title: String!
    prompt: String!
    imageUrl: String!
    reviewWinnerArt: ReviewWinnerArt
  }
`
