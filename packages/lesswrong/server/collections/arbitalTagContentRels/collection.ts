import schema from '@/lib/collections/arbitalTagContentRels/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const ArbitalTagContentRels = createCollection({
  collectionName: 'ArbitalTagContentRels',
  typeName: 'ArbitalTagContentRel',
  schema,
});


export default ArbitalTagContentRels; 
