import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'

export const FeaturedResources: FeaturedResourcesCollection = createCollection({
  collectionName: 'FeaturedResources',
  typeName: 'FeaturedResource',
  schema,
  resolvers: getDefaultResolvers('FeaturedResources'),
});

addUniversalFields({collection: FeaturedResources})

export default FeaturedResources;

