import schema from '@/lib/collections/featuredResources/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";

export const FeaturedResources: FeaturedResourcesCollection = createCollection({
  collectionName: 'FeaturedResources',
  typeName: 'FeaturedResource',
  schema,
  resolvers: getDefaultResolvers('FeaturedResources'),
});


export default FeaturedResources;

