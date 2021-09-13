import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, ensureIndex } from '../../collectionUtils'

export const FeaturedResources: FeaturedResourcesCollection = createCollection({
  collectionName: 'FeaturedResources',
  typeName: 'FeaturedResources',
  schema,
});

addUniversalFields({collection: FeaturedResources})

export default FeaturedResources;

