import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { getVoteGraphql } from "@/server/votingGraphQL";

export const MultiDocuments = createCollection({
  collectionName: 'MultiDocuments',
  typeName: 'MultiDocument',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('MultiDocuments', { parentDocumentId: 1, collectionName: 1 });
    indexSet.addIndex('MultiDocuments', { slug: 1 });
    indexSet.addIndex('MultiDocuments', { oldSlugs: 1 });
    indexSet.addCustomPgIndex(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multi_documents_pingbacks ON "MultiDocuments" USING gin(pingbacks);`);
    return indexSet;
  },
  resolvers: getDefaultResolvers('MultiDocuments'),
  logChanges: true,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('MultiDocuments');
