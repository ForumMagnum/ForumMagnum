import { addGraphQLSchema } from '@/lib/vulcan-lib/graphql';

addGraphQLSchema(`
  type EssayResult {
    title: String!
    prompt: String!
    imageUrl: String!
    reviewWinnerArt: ReviewWinnerArt
  }
`);
