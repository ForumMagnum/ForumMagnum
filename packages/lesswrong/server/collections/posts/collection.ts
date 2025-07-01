import schema from '@/lib/collections/posts/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { userOwns, userCanDo, userIsMemberOf, userIsPodcaster } from '@/lib/vulcan-users/permissions';
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from '@/lib/collections/posts/helpers';
import { userCanPost } from '@/lib/collections/users/helpers';
import { getVoteGraphql } from '@/server/votingGraphQL';


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

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('Posts');

export default Posts;
