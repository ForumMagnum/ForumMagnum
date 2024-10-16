import JargonTerms from "@/lib/collections/jargonTerms/collection";
import { augmentFieldsDict } from "@/lib/utils/schemaUtils";
import { getAdminTeamAccount } from "@/server/callbacks/commentCallbacks";
import Revisions from "@/lib/collections/revisions/collection";

augmentFieldsDict(JargonTerms, {
  humansAndOrAIEdited: {
    resolveAs: {
      type: 'String',
      resolver: async (document: DbJargonTerm, args: void, context: ResolverContext): Promise<JargonTermsDefaultFragment['humansAndOrAIEdited']> => {
        const botAccount = await getAdminTeamAccount();
        const [earliestRevision, latestRevision] = await Promise.all([
          Revisions.findOne(
            { documentId: document._id, collectionName: 'JargonTerms' },
            { sort: { createdAt: 1 } }
          ),
          Revisions.findOne(
            { documentId: document._id, collectionName: 'JargonTerms' },
            { sort: { createdAt: -1 } }
          )
        ]);
        
        const madeByAI = earliestRevision?.userId === botAccount?._id;
        const editedByHumans = latestRevision?.userId !== botAccount?._id;

        console.log({ latestRevision, earliestRevision, madeByAI, editedByHumans });
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