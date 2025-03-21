import { createCollection } from '@/lib/vulcan-lib/collections';
import schema from '@/lib/collections/arbitalTagContentRels/schema';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';

export const ArbitalTagContentRels = createCollection({
  collectionName: 'ArbitalTagContentRels',
  typeName: 'ArbitalTagContentRel',
  schema,
  resolvers: getDefaultResolvers('ArbitalTagContentRels'),
  mutations: getDefaultMutations('ArbitalTagContentRels'),
});


export default ArbitalTagContentRels; 
