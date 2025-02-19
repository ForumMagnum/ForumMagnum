import {ensureIndex} from "../../collectionIndexUtils";
import {addUniversalFields, getDefaultMutations, getDefaultResolvers} from "../../collectionUtils";
import {MutationOptions} from "../../vulcan-core/default_mutations";
import {createCollection} from "../../vulcan-lib";
import {userOwns} from "../../vulcan-users/permissions";
import schema from "./schema";

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
