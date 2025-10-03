import schema from '@/lib/collections/commentEmbeddings/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const CommentEmbeddings: CommentEmbeddingsCollection = createCollection({
  collectionName: 'CommentEmbeddings',
  typeName: 'CommentEmbedding',
  schema,

  // This is where you can add indexes for the collection.
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CommentEmbeddings', { commentId: 1, model: 1 }, { unique: true, concurrently: true });
    indexSet.addCustomPgIndex(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_CommentEmbeddings_embedding_cosine_distance"
      ON "CommentEmbeddings" USING hnsw (embeddings vector_cosine_ops);
    `);
    return indexSet;
  },
});


export default CommentEmbeddings;
