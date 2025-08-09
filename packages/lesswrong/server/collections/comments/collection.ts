import schema from '@/lib/collections/comments/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { commentVotingOptions } from '@/lib/collections/comments/voting';

export const Comments = createCollection({
  collectionName: 'Comments',
  typeName: 'Comment',
  schema,
  voteable: commentVotingOptions,
});

export default Comments;
