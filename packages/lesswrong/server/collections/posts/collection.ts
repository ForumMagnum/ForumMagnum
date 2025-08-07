import schema from '@/lib/collections/posts/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const Posts = createCollection({
  collectionName: 'Posts',
  typeName: 'Post',
  schema,
  voteable: {
    timeDecayScoresCronjob: true,
  },
  dependencies: [
    {type: "extension", name: "btree_gin"},
    {type: "extension", name: "earthdistance"},
  ],
});

export default Posts;
