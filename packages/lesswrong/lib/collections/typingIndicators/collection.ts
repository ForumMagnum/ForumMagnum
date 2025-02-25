import {ensureIndex} from "../../collectionIndexUtils";
import { createCollection } from "../../vulcan-lib/collections";
import {userOwns} from "../../vulcan-users/permissions";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';

export const TypingIndicators: TypingIndicatorsCollection = createCollection({
  collectionName: 'TypingIndicators',
  typeName: 'TypingIndicator',
  schema,
  resolvers: getDefaultResolvers('TypingIndicators'),
  logChanges: true,
})

TypingIndicators.checkAccess = async (user: DbUser|null, document: DbTypingIndicator, context: ResolverContext|null): Promise<boolean> => {
  // no access here via GraphQL API. Instead, access via direct database query inside server sent event logic
  return false
};

addUniversalFields({ collection: TypingIndicators })

ensureIndex(TypingIndicators, { documentId: 1, userId: 1 }, { unique: true });

export default TypingIndicators;
