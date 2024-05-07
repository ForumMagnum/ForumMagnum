import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../vulcan-lib";
import type { BannerEmoji } from "../../components/ea-forum/EAEmojisHeader";

addGraphQLSchema(`
  type BannerEmoji {
    userId: String!
    displayName: String!
    emoji: String!
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
      context: ResolverContext,
    ): Promise<BannerEmoji[]> => {
      return context.repos.databaseMetadata.getBannerEmojis();
    },
  },
  Mutation: {
    AddBannerEmoji: async (
      _root: void,
      {emoji, x, y, theta}: {
        emoji: string,
        x: number,
        y: number,
        theta: number,
      },
      context: ResolverContext,
    ): Promise<BannerEmoji[]> => {
      if (!context.currentUser) {
        throw new Error("Permission denied");
      }
      if (
        !/^\p{Extended_Pictographic}$/u.test(emoji) ||
        typeof x !== "number" || x < 0 || x > 1 ||
        typeof y !== "number" || y < 0 || y > 1 ||
        typeof theta !== "number" || theta < -25 || theta > 25
      ) {
        throw new Error(`Invalid parameters: ${{emoji, x, y, theta}}`);
      }
      return context.repos.databaseMetadata.addBannerEmoji(
        context.currentUser._id,
        emoji,
        x,
        y,
        theta,
      );
    },
    RemoveBannerEmoji: (
      _root: void,
      _: {},
      context: ResolverContext,
    ) => {
      if (!context.currentUser) {
        throw new Error("Permission denied");
      }
      return context.repos.databaseMetadata.removeBannerEmoji(
        context.currentUser._id,
      );
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
    x: Float!,
    y: Float!,
    theta: Float!
  ): [BannerEmoji!]!
`);
addGraphQLMutation(`
  RemoveBannerEmoji: [BannerEmoji!]!
`);
