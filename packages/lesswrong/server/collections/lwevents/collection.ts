import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';



export const LWEvents = createCollection({
  collectionName: 'LWEvents',
  typeName: 'LWEvent',
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
});

export default LWEvents;
