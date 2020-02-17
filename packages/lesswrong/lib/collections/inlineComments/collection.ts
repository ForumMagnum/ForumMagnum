import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
import schema from './schema';

export const InlineComments = createCollection({
  collectionName: 'InlineComments',
  typeName: 'InlineComment',
  schema,
  resolvers: getDefaultResolvers('InlineComments'),
  mutations: getDefaultMutations('InlineComments')
}) 