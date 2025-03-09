import schema from '@/lib/collections/lwevents/schema';
import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

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
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LWEvents', {name:1, createdAt:-1});
    indexSet.addIndex('LWEvents', {name:1, userId:1, documentId:1, createdAt:-1})
    // (supposedly) used in constructAkismetReport
    indexSet.addIndex('LWEvents', {name:1, userId:1, createdAt:-1})

    // Index used in manual user-by-IP queries, and in some moderator UI
    indexSet.addCustomPgIndex(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "manual_idx__LWEvents_properties_ip"
        ON public."LWEvents" USING gin
        ((("properties"->>'ip')::TEXT))
        WITH (fastupdate=True)
        WHERE name='login';
    `);
    return indexSet;
  },
  resolvers: getDefaultResolvers('LWEvents'),
  mutations: getDefaultMutations('LWEvents', options),
});

export default LWEvents;
