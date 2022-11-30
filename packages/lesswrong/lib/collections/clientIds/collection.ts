import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils';

export const ClientIds: ClientIdsCollection = createCollection({
  collectionName: "ClientIds",
  typeName: "ClientId",
  schema,
  resolvers: getDefaultResolvers('ClientIds'),
});

addUniversalFields({
  collection: ClientIds,
  createdAtOptions: {viewableBy: ['admins']},
});

ensureIndex(ClientIds, {clientId: 1});
ensureIndex(ClientIds, {userIds: 1});
