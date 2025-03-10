import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const FeaturedResources: FeaturedResourcesCollection = createCollection({
  collectionName: 'FeaturedResources',
  typeName: 'FeaturedResource',
  schema,
  resolvers: getDefaultResolvers('FeaturedResources'),
});

export default FeaturedResources;

