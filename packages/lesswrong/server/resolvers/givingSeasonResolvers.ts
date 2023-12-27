import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../vulcan-lib";
import { GivingSeasonHeart, eaGivingSeason23ElectionName } from "../../lib/eaGivingSeason";

addGraphQLSchema(`
  type GivingSeasonHeart {
    userId: String!
    displayName: String!
    x: Float!
    y: Float!
    theta: Float!
  }
`);

const givingSeasonResolvers = {
  Query: {
    GivingSeasonHearts: async (
      _root: void,
      {electionName}: {electionName: string},
      context: ResolverContext,
    ): Promise<GivingSeasonHeart[]> => {
      if (electionName !== eaGivingSeason23ElectionName) {
        throw new Error(`Invalid election name: ${electionName}`);
      }
      return context.repos.databaseMetadata.getGivingSeasonHearts(electionName);
    },
  },
  Mutation: {
    AddGivingSeasonHeart: async (
      _root: void,
      {electionName, x, y, theta}: {
        electionName: string,
        x: number,
        y: number,
        theta: number,
      },
      context: ResolverContext,
    ): Promise<GivingSeasonHeart[]> => {
      if (electionName !== eaGivingSeason23ElectionName) {
        throw new Error(`Invalid election name: ${electionName}`);
      }
      if (!context.currentUser) {
        throw new Error("Permission denied");
      }
      if (
        typeof x !== "number" || x < 0 || x > 1 ||
        typeof y !== "number" || y < 0 || y > 1 ||
        typeof theta !== "number" || theta < -25 || theta > 25
      ) {
        throw new Error(`Invalid parameters: ${{x, y, theta}}`);
      }
      return context.repos.databaseMetadata.addGivingSeasonHeart(
        electionName,
        context.currentUser._id,
        x,
        y,
        theta,
      );
    },
    RemoveGivingSeasonHeart: (
      _root: void,
      {electionName}: {electionName: string},
      context: ResolverContext,
    ) => {
      if (electionName !== eaGivingSeason23ElectionName) {
        throw new Error(`Invalid election name: ${electionName}`);
      }
      if (!context.currentUser) {
        throw new Error("Permission denied");
      }
      return context.repos.databaseMetadata.removeGivingSeasonHeart(
        electionName,
        context.currentUser._id,
      );
    },
  },
};

addGraphQLResolvers(givingSeasonResolvers);
addGraphQLQuery(`
  GivingSeasonHearts(electionName: String!): [GivingSeasonHeart!]!
`);
addGraphQLMutation(`
  AddGivingSeasonHeart(
    electionName: String!,
    x: Float!,
    y: Float!,
    theta: Float!
  ): [GivingSeasonHeart!]!
`);
addGraphQLMutation(`
  RemoveGivingSeasonHeart(electionName: String!): [GivingSeasonHeart!]!
`);
