import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";

export const ArbitalTagContentRels = createCollection({
  collectionName: 'ArbitalTagContentRels',
  typeName: 'ArbitalTagContentRel',
    resolvers: getDefaultResolvers('ArbitalTagContentRels'),
});


export default ArbitalTagContentRels; 
