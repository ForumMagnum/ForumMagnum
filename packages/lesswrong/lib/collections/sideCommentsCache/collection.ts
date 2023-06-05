import { createCollection } from '../../vulcan-lib';
import { ensureIndex } from '../../collectionIndexUtils';
import { addUniversalFields } from '../../collectionUtils'
import { foreignKeyField } from '../../utils/schemaUtils'

const schema: SchemaType<DbSideCommentsCache> = {
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
    }),
  },
  generatedAt: {
    type: Date,
  },
  version: {
    type: Number,
  },
  sideComments: {
    type: Object,
  },
};

export interface SideCommentsCacheValue {
  version: number,
  generatedAt: Date,
  annotatedHtml: string
  commentsByBlock: Record<string,string[]>
}

/**
 * SideCommentsCache collection: Stores the matching between comments on a post,
 * and paragraph IDs within the post. Invalid if the cache-generation
 * time is older than when the post was last modified (modifiedAt) or
 * commented on (lastCommentedAt).
 */
export const SideCommentsCache: SideCommentsCachesCollection = createCollection({
  collectionName: "SideCommentsCaches",
  typeName: "SideCommentsCache",
  collectionType: "pg",
  schema,
  logChanges: false,
});

addUniversalFields({collection: SideCommentsCache});
ensureIndex(SideCommentsCache, { postId: 1, version: 1, generatedAt: 1 });

export default SideCommentsCache;
