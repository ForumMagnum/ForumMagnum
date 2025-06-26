import { userCanDo } from "@/lib/vulcan-users/permissions.ts";
import Spotlights from "@/server/collections/spotlights/collection";
import gql from "graphql-tag";

export const spotlightGqlMutations = {
  async publishAndDeDuplicateSpotlight(root: void, { spotlightId }: {
    spotlightId: string
  }, context: ResolverContext) {
    const {currentUser} = context;
    const spotlight = await context.Spotlights.findOne(spotlightId)
    if (!spotlight) throw new Error("Invalid spotlightId");
    
    if (currentUser && userCanDo(currentUser, 'spotlights.edit.all')) {
      await Spotlights.rawUpdateMany({documentId: spotlight.documentId}, {
        $set: {
          deletedDraft: true
        }
      })
      await Spotlights.rawUpdateOne({_id: spotlight._id}, {
        $set: {
          deletedDraft: false,
          draft: false
        }
      })
    } else {
      throw new Error("User cannot edit spotlights");
    }
  }
}

export const spotlightGqlQueries = {
  async currentSpotlight(root: void, args: {}, context: ResolverContext, info: AnyBecauseTodo) {
    const mostRecentlyPromoted = await Spotlights.find(
      { draft: false, deletedDraft: false, lastPromotedAt: {$lt: new Date()} },
      {
        sort: {lastPromotedAt: -1, position: 1}
      }
    ).fetch();
    return mostRecentlyPromoted?.[0] ?? null;
  }
};

export const spotlightGqlTypeDefs = gql`
  extend type Mutation {
    publishAndDeDuplicateSpotlight(spotlightId: String): Spotlight
  }
  extend type Query {
    currentSpotlight: Spotlight
  }
`
