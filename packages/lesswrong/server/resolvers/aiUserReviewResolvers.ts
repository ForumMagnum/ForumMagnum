import gql from 'graphql-tag';
import { getAnthropicClientOrThrow } from '../languageModels/anthropicClient';
import { dataToMarkdown } from '../editor/conversionUtils';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';

function getReviewPrompt(reviewerName: string): string {
  return `Look over this post and review it as if you were ${reviewerName} from LessWrong. (Be willing to critique but don't go out of your way to critique unless you think ${reviewerName} would)

At the end, give your simulation of ${reviewerName}'s take on whether this is above-the-bar for approval on lesswrong. 

Make the the final line of the review has ONLY one of the following words (and no other words):  Definitely Reject, Probably Reject, Lean Reject, Lean Approve, Probably Approve, Definitely Approve.`;
}

export const aiUserReviewGqlTypeDefs = gql`
  extend type Mutation {
    aiUserReview(postId: String!, reviewerName: String!): String!
  }
`;

export const aiUserReviewGqlMutations = {
  async aiUserReview(_root: void, args: { postId: string, reviewerName: string }, context: ResolverContext) {
    const { currentUser } = context;
    if (!userIsAdmin(currentUser)) {
      throw new Error('Only admins can run AI user reviews');
    }

    const postWithContents = await context.repos.posts.getPostWithContents(args.postId);
    if (!postWithContents) {
      throw new Error(`Post not found: ${args.postId}`);
    }
    if (!postWithContents.contents?.originalContents) {
      throw new Error(`Post has no contents: ${args.postId}`);
    }

    const markdown = dataToMarkdown(
      postWithContents.contents.originalContents.data,
      postWithContents.contents.originalContents.type
    );

    if (!markdown) {
      throw new Error(`Could not convert post contents to markdown: ${args.postId}`);
    }

    const systemPrompt = getReviewPrompt(args.reviewerName);
    const client = getAnthropicClientOrThrow();
    const result = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Post title: "${postWithContents.title}"\n\n${markdown}` }],
    });

    const response = result.content[0];
    if (response.type !== 'text') {
      throw new Error('Invalid non-text response from Claude');
    }

    return response.text;
  },
};
