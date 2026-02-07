import gql from "graphql-tag";
import { Posts } from "@/server/collections/posts/collection";
import Users from "@/server/collections/users/collection";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import moment from "moment";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";

interface ReviewResultsPostEntry {
  rank: number;
  title: string;
  postUrl: string;
  authorName: string;
  coauthorNames: string[];
  votes: number[];
}

interface ReviewResultsTableData {
  year: number;
  results: ReviewResultsPostEntry[];
}

export const reviewResultsGqlQueries = {
  async ReviewResultsTableData(
    root: void,
    { year }: { year: number },
    context: ResolverContext
  ): Promise<ReviewResultsTableData> {
    const { currentUser } = context;
    if (!currentUser || !userIsAdmin(currentUser)) {
      throw new Error("Only admins can fetch review results data");
    }

    const posts = await Posts.find({
      postedAt: {
        $gte: moment(`${year}-01-01`).toDate(),
        $lt: moment(`${year + 1}-01-01`).toDate(),
      },
      finalReviewVoteScoreAllKarma: { $gte: 1 },
      reviewCount: { $gte: 1 },
      positiveReviewVoteCount: { $gte: 1 },
    }).fetch();

    posts.sort((a, b) => {
      return b.finalReviewVoteScoreHighKarma - a.finalReviewVoteScoreHighKarma;
    });

    const allUserIds = [...new Set(posts.flatMap((post) => [post.userId, ...post.coauthorUserIds]))];
    const users = await Users.find({ _id: { $in: allUserIds } }).fetch();
    const usersById = Object.fromEntries(users.map((u) => [u._id, u]));

    const results: ReviewResultsPostEntry[] = posts.map((post, i) => ({
      rank: i,
      title: post.title,
      postUrl: postGetPageUrl(post),
      authorName: usersById[post.userId]?.displayName ?? "Unknown",
      coauthorNames: post.coauthorUserIds
        .map((id) => usersById[id]?.displayName)
        .filter((name): name is string => !!name),
      votes: [...(post.finalReviewVotesAllKarma ?? [])].sort((a, b) => b - a),
    }));

    return { year, results };
  },
};

export const reviewResultsGqlTypeDefs = gql`
  type ReviewResultsPostEntry {
    rank: Int!
    title: String!
    postUrl: String!
    authorName: String!
    coauthorNames: [String!]!
    votes: [Float!]!
  }

  type ReviewResultsTableData {
    year: Int!
    results: [ReviewResultsPostEntry!]!
  }

  extend type Query {
    ReviewResultsTableData(year: Int!): ReviewResultsTableData
  }
`;
