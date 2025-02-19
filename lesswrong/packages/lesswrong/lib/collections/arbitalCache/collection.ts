import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { ensureIndex } from '../../collectionIndexUtils';

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
  logChanges: true,
});

addUniversalFields({collection: ArbitalCaches})
ensureIndex(ArbitalCaches, { pageAlias: 1 })
ensureIndex(ArbitalCaches, { fetchedAt: 1 })

export default ArbitalCaches;
