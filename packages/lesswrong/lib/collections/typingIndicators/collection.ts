import {addUniversalFields, getDefaultMutations, getDefaultResolvers} from "../../collectionUtils";
import {MutationOptions} from "../../vulcan-core/default_mutations";
import {createCollection} from "../../vulcan-lib";
import {userOwns} from "../../vulcan-users/permissions";
import schema from "./schema";

const options: MutationOptions<DbTypingIndicator> = {
  newCheck: (user: DbUser|null, document: DbTypingIndicator|null) => {
    if (!user || !document) return false;
    return true
  },

  editCheck: (user: DbUser|null, document: DbTypingIndicator|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) 
  },

  removeCheck: (user: DbUser|null, document: DbTypingIndicator|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) 
  },
}

export const TypingIndicators: TypingIndicatorsCollection = createCollection({
  collectionName: 'TypingIndicators',
  typeName: 'TypingIndicator',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('TypingIndicators'),
  mutations: getDefaultMutations('TypingIndicators', options),
  logChanges: true,
})

TypingIndicators.checkAccess = async (user: DbUser|null, document: DbTypingIndicator, context: ResolverContext|null): Promise<boolean> => {
  // no access here via GraphQL API. Instead, access via direct database query inside server sent event logic
  return false
};

addUniversalFields({collection: TypingIndicators})

export default TypingIndicators;
