import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations, } from '../../collectionUtils';
import schema from './schema';

export const ArbitalTagContentRels = createCollection({
  collectionName: 'ArbitalTagContentRels',
  typeName: 'ArbitalTagContentRel',
  schema,
  resolvers: getDefaultResolvers('ArbitalTagContentRels'),
  mutations: getDefaultMutations('ArbitalTagContentRels'),
});

addUniversalFields({ collection: ArbitalTagContentRels });

export default ArbitalTagContentRels; 
