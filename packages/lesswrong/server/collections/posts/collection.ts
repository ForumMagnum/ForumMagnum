import schema from '@/lib/collections/posts/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { userOwns, userCanDo, userIsMemberOf, userIsPodcaster } from '@/lib/vulcan-users/permissions';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from '@/lib/collections/posts/helpers';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { userCanPost } from '@/lib/collections/users/helpers';
import { getVoteGraphql } from '@/server/votingGraphQL';

const options: MutationOptions<DbPost> = {
  newCheck: (user: DbUser|null) => {
    if (!user) return false;
    return userCanPost(user)
  },

  editCheck: async (user: DbUser|null, document: DbPost|null, context: ResolverContext) => {
    if (!user || !document) return false;
    if (userCanDo(user, 'posts.alignment.move.all') ||
        userCanDo(user, 'posts.alignment.suggest') ||
        userIsMemberOf(user, 'canSuggestCuration')) {
      return true
    }

    return canUserEditPostMetadata(user, document) || userIsPodcaster(user) || await userIsPostGroupOrganizer(user, document, context)
    // note: we can probably get rid of the userIsPostGroupOrganizer call since that's now covered in canUserEditPostMetadata, but the implementation is slightly different and isn't otherwise part of the PR that restrutured canUserEditPostMetadata
  },

  removeCheck: (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'posts.edit.own') : userCanDo(user, `posts.edit.all`)
  },
}

export const Posts = createCollection({
  collectionName: 'Posts',
  typeName: 'Post',
  schema,
  resolvers: getDefaultResolvers('Posts'),
  mutations: getDefaultMutations('Posts', options),
  logChanges: true,
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
