import JargonTerms from "@/lib/collections/jargonTerms/collection";
import { augmentFieldsDict } from "@/lib/utils/schemaUtils";
import { getAdminTeamAccountId } from "@/server/callbacks/commentCallbacks";
import Revisions from "@/lib/collections/revisions/collection";

augmentFieldsDict(JargonTerms, {
  humansAndOrAIEdited: {
    resolveAs: {
      type: 'String',
      resolver: async (document: DbJargonTerm, args: void, context: ResolverContext): Promise<JargonTermsDefaultFragment['humansAndOrAIEdited'] | null> => {
        const botAccountId = await getAdminTeamAccountId();
        if (!botAccountId) {
          return null;
        }

        const selector = { documentId: document._id, collectionName: 'JargonTerms' };

        const [earliestRevision, latestRevision] = await Promise.all([
          Revisions.findOne(selector, { sort: { createdAt: 1 } }),
          Revisions.findOne(selector, { sort: { createdAt: -1 } })
        ]);

        if (!earliestRevision || !latestRevision) {
          return null;
        }
        
        const madeByAI = earliestRevision.userId === botAccountId;
        const editedByHumans = latestRevision.userId !== botAccountId;

        if (madeByAI && editedByHumans) {
          return 'humansAndAI';
        } else if (!madeByAI && editedByHumans) {
          return 'humans';
        } else {
          return 'AI';
        }
      }
    }
  }
});
