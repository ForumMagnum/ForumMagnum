import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const FeaturedResources: FeaturedResourcesCollection = createCollection({
  collectionName: 'FeaturedResources',
  typeName: 'FeaturedResource',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'switching',
  schema,
  resolvers: getDefaultResolvers('FeaturedResources'),
});

addUniversalFields({collection: FeaturedResources})

export default FeaturedResources;

