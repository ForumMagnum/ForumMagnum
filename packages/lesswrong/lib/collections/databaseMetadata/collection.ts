import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const DatabaseMetadata: DatabaseMetadataCollection = createCollection({
  collectionName: "DatabaseMetadata",
  typeName: "DatabaseMetadata",
  collectionType: forumTypeSetting.get() === "EAForum" ? "pg" : "switching",
  schema,
});
addUniversalFields({collection: DatabaseMetadata});

ensureIndex(DatabaseMetadata, { name: 1 }, { unique: true });
