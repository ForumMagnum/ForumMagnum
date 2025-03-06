import { createCollection } from "@/lib/vulcan-lib/collections";
import schema from "@/lib/collections/typingIndicators/schema";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const TypingIndicators: TypingIndicatorsCollection = createCollection({
  collectionName: 'TypingIndicators',
  typeName: 'TypingIndicator',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('TypingIndicators', { documentId: 1, userId: 1 }, { unique: true });
    return indexSet;
  },
  resolvers: getDefaultResolvers('TypingIndicators'),
  logChanges: true,
})

TypingIndicators.checkAccess = async (user: DbUser|null, document: DbTypingIndicator, context: ResolverContext|null): Promise<boolean> => {
  // no access here via GraphQL API. Instead, access via direct database query inside server sent event logic
  return false
};


export default TypingIndicators;
