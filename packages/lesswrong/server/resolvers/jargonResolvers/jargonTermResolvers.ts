import { getAdminTeamAccountId } from "@/server/utils/adminTeamAccount";

export const jargonTermResolvers = {
  humansAndOrAIEdited: {
    resolveAs: {
      type: 'String',
      resolver: async (document: DbJargonTerm, args: void, context: ResolverContext): Promise<JargonTermsPost['humansAndOrAIEdited'] | null> => {        
        const botAccountId = await getAdminTeamAccountId();
        if (!botAccountId) {
          return null;
        }

        const { Revisions } = context;

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
} satisfies Record<string, CollectionFieldSpecification<"JargonTerms">>;
