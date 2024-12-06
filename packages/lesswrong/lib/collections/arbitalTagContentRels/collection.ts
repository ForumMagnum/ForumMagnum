import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations, } from '../../collectionUtils';
import { userCanUseTags } from '../../betas';
import { makeVoteable } from '../../make_voteable';
import schema from './schema';

export const ArbitalTagContentRels = createCollection({
  collectionName: 'ArbitalTagContentRels',
  typeName: 'ArbitalTagContentRel',
  schema,
  resolvers: getDefaultResolvers('ArbitalTagContentRels'),
  mutations: getDefaultMutations('ArbitalTagContentRels', {
    newCheck: (user: DbUser | null, document: DbArbitalTagContentRel | null) => {
      return userCanUseTags(user);
    },
    editCheck: (user: DbUser | null, document: DbArbitalTagContentRel | null) => {
      return userCanUseTags(user);
    },
    removeCheck: (user: DbUser | null, document: DbArbitalTagContentRel | null) => {
      return false;
    },
  }),
});

ArbitalTagContentRels.checkAccess = async (
  currentUser: DbUser | null,
  document: DbArbitalTagContentRel,
  context: any
): Promise<boolean> => {
  return true;
};

addUniversalFields({ collection: ArbitalTagContentRels });

export default ArbitalTagContentRels; 