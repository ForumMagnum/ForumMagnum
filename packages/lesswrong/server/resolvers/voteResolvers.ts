import { VotesRepo } from "../repos";
import { TopUpvotedUser } from "../repos/VotesRepo";
import { defineQuery } from "../utils/serverGraphqlUtil";

defineQuery({
  name: 'TopUpvotedUsers',
  resultType: 'TopUpvotedUsersResult',
  schema: `
    type TopUpvotedUsersResult {
      topUpvotedUsers: [TopUpvotedUser!]
    }
    type TopUpvotedUser {
      authorId: String!
      displayName: String!
    }
  `,
  fn: async (root, args, context): Promise<{ topUpvotedUsers: TopUpvotedUser[] | null }> => {
    if (!context.currentUser) return { topUpvotedUsers: null };

    const votesRepo = new VotesRepo();
    const topUpvotedUsers = await votesRepo.getTopUpvotedUsers(context.currentUser._id);
    return { topUpvotedUsers };
  }
});
