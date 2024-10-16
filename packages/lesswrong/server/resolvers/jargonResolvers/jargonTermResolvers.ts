import JargonTerms from "@/lib/collections/jargonTerms/collection";
import { GraphQLJSON } from "graphql-type-json";
import { augmentFieldsDict } from "@/lib/utils/schemaUtils";
import { getAdminTeamAccount } from "@/server/callbacks/commentCallbacks";
import Revisions from "@/lib/collections/revisions/collection";

augmentFieldsDict(JargonTerms, {
  humansAndOrAIEdited: {
    resolveAs: {
      type: GraphQLJSON,
      resolver: async (document: DbJargonTerm, args: void, context: ResolverContext) => {
        const botAccount = await getAdminTeamAccount()
        const earliestRevision = await Revisions.findOne(
          { documentId: document.postId, documentType: 'jargonTerm' },
          { sort: { createdAt: 1 } }
        );
        const latestRevision = await Revisions.findOne(
          { documentId: document.postId, documentType: 'jargonTerm' },
          { sort: { createdAt: -1 } }
        );
        const madeByAI = earliestRevision?.userId == botAccount?._id
        const editedByHumans = latestRevision?.userId != botAccount?._id
        if (madeByAI && editedByHumans) {
          return 'humansAndAI'
        } else if (!madeByAI && editedByHumans) {
          return 'humans'
        } else {
          return 'AI'
        }
      }
    }
  }
})