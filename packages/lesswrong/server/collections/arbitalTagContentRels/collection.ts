import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';

export const ArbitalTagContentRels = createCollection({
  collectionName: 'ArbitalTagContentRels',
  typeName: 'ArbitalTagContentRel',
    resolvers: getDefaultResolvers('ArbitalTagContentRels'),
});


export default ArbitalTagContentRels; 
