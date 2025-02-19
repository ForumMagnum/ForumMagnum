import { userCanDo } from "@/lib/vulcan-users";
import Spotlights from "@/lib/collections/spotlights/collection";
import { addGraphQLMutation, addGraphQLResolvers } from "../vulcan-lib";

const specificResolvers = {
  Mutation: {
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
};

addGraphQLResolvers(specificResolvers);
addGraphQLMutation('publishAndDeDuplicateSpotlight(spotlightId: String): Spotlight');
