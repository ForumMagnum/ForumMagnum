import schema from '@/lib/collections/featuredResources/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";

export const FeaturedResources: FeaturedResourcesCollection = createCollection({
  collectionName: 'FeaturedResources',
  typeName: 'FeaturedResource',
  schema,
  resolvers: getDefaultResolvers('FeaturedResources'),
});

addUniversalFields({collection: FeaturedResources})

export default FeaturedResources;

