import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const schema: SchemaType<"ArbitalCaches"> = {
  pageAlias: {
    type: String,
    nullable: false,
  },
  title: {
    type: String,
    nullable: false,
  },
  fetchedAt: {
    type: Date,
    nullable: false,
  },
  sanitizedHtml: {
    type: String,
    nullable: false,
  },
};

/**
 * Cache for link-previews of Arbital links.
 */
export const ArbitalCaches: ArbitalCachesCollection = createCollection({
  collectionName: 'ArbitalCaches',
  typeName: 'ArbitalCaches',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ArbitalCaches', { pageAlias: 1 })
    indexSet.addIndex('ArbitalCaches', { fetchedAt: 1 })
    return indexSet;
  },
  logChanges: true,
});

addUniversalFields({collection: ArbitalCaches})

export default ArbitalCaches;
