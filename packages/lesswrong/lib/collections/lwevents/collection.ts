import schema from './schema';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

const options: MutationOptions<DbLWEvent> = {
  newCheck: (user: DbUser|null, document: DbLWEvent|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'events.new.own') : userCanDo(user, `events.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbLWEvent|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `events.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbLWEvent|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `events.remove.all`)
  },
}


export const LWEvents = createCollection({
  collectionName: 'LWEvents',
  typeName: 'LWEvent',
  schema,
  resolvers: getDefaultResolvers('LWEvents'),
  mutations: getDefaultMutations('LWEvents', options),
});

addUniversalFields({
  collection: LWEvents,
  createdAtOptions: {canRead: ['members']},
});

LWEvents.checkAccess = async (user: DbUser|null, document: DbLWEvent, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  if (document.name === "gatherTownUsersCheck") return true
  return userOwns(user, document) ? userCanDo(user, 'events.view.own') : userCanDo(user, `events.view.all`)
};

export default LWEvents;
