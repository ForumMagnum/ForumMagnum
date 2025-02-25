import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { ensureIndex } from '../../collectionIndexUtils';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const DigestPosts: DigestPostsCollection = createCollection({
  collectionName: 'DigestPosts',
  typeName: 'DigestPost',
  schema,
  resolvers: getDefaultResolvers('DigestPosts'),
  mutations: getDefaultMutations('DigestPosts'),
  logChanges: true,
});

addUniversalFields({collection: DigestPosts})

ensureIndex(DigestPosts, {digestId: 1})

export default DigestPosts;
