import schema from '@/lib/collections/featuredResources/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const FeaturedResources = createCollection({
  collectionName: 'FeaturedResources',
  typeName: 'FeaturedResource',
  schema,
});


export default FeaturedResources;

