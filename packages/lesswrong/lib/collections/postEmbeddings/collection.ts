import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionIndexUtils';

const schema: SchemaType<DbPostEmbeddings> = {
  postId: {
    type: String,
  },
  embeddingType: {
    type: String,
  },
  embeddingVector: {
    type: Array,
  },
  "embeddingVector.$": {
    type: Number,
  },
}

export const PostEmbeddings: PostEmbeddingsCollection = createCollection({
  collectionName: 'PostEmbeddings',
  typeName: 'PostEmbedding',
  schema,
  logChanges: false,
});

addUniversalFields({
  collection: PostEmbeddings,
});

export default PostEmbeddings;

