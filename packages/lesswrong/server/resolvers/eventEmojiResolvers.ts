import {
  addGraphQLMutation,
  addGraphQLQuery,
  addGraphQLResolvers,
  addGraphQLSchema,
} from "../vulcan-lib";
import { BannerEmoji, MAX_THETA } from "../../components/ea-forum/EAEmojisHeader";
import { userIsAdminOrMod } from "../../lib/vulcan-users";

addGraphQLSchema(`
  type BannerEmoji {
    userId: String!
    displayName: String!
    emoji: String!
    link: String!
    description: String!
    x: Float!
    y: Float!
    theta: Float!
  }
`);

const bannerEmojiResolvers = {
  Query: {
    BannerEmojis: async (
      _root: void,
      _: {},
      {repos}: ResolverContext,
    ): Promise<BannerEmoji[]> => repos.databaseMetadata.getBannerEmojis(),
  },
  Mutation: {
    AddBannerEmoji: async (
      _root: void,
      {emoji, link, description, x, y, theta}: {
        emoji: string,
        link: string,
        description: string,
        x: number,
        y: number,
        theta: number,
      },
      {currentUser, repos}: ResolverContext,
    ): Promise<BannerEmoji[]> => {
      if (!currentUser) {
        throw new Error("Permission denied");
      }
      if (
        !/^\p{Extended_Pictographic}$/u.test(emoji) ||
        !link || typeof link !== "string" ||
        !description || typeof description !== "string" ||
        typeof x !== "number" || x < 0 || x > 1 ||
        typeof y !== "number" || y < 0 || y > 1 ||
        typeof theta !== "number" || theta < -MAX_THETA || theta > MAX_THETA
      ) {
        const params = {emoji, link, description, x, y, theta};
        throw new Error(`Invalid parameters: ${params}`);
      }
      return repos.databaseMetadata.addBannerEmoji(
        currentUser._id,
        emoji,
        link,
        description,
        x,
        y,
        theta,
      );
    },
    RemoveBannerEmoji: (
      _root: void,
      {userId}: {userId: string},
      {currentUser, repos}: ResolverContext,
    ) => {
      if (!currentUser) {
        throw new Error("Not logged in");
      }
      if (currentUser._id !== userId && !userIsAdminOrMod(currentUser)) {
        throw new Error("Permission denied");
      }
      return repos.databaseMetadata.removeBannerEmoji(userId);
    },
  },
};

addGraphQLResolvers(bannerEmojiResolvers);
addGraphQLQuery(`
  BannerEmojis: [BannerEmoji!]!
`);
addGraphQLMutation(`
  AddBannerEmoji(
    emoji: String!,
    link: String!,
    description: String!,
    x: Float!,
    y: Float!,
    theta: Float!
  ): [BannerEmoji!]!
`);
addGraphQLMutation(`
  RemoveBannerEmoji(userId: String!): [BannerEmoji!]!
`);
