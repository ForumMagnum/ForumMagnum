import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionIndexUtils';

const schema: SchemaType<DbPostEmbedding> = {
  postId: {
    type: String,
  },
  embeddingType: {
    type: String,
  },
  
  // NOTE: When converted mongodb->postgres, this field should have special
  // attention to its type for performance. This is an embedding vector, which
  // is going to 1k+ f32. Or maybe it only needs to be f16. But, the
  // main thing is, it would be very nice to be able to do dot-products inside
  // of DB queries.
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

