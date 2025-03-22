import { createCollection } from '@/lib/vulcan-lib/collections';
import { userCanDo, userOwns } from '@/lib/vulcan-users/permissions';
import { userIsAllowedToComment } from '@/lib/collections/users/helpers';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { commentVotingOptions } from '@/lib/collections/comments/voting';

export const commentMutationOptions: MutationOptions<DbComment> = {
  newCheck: async (user: DbUser|null, document: DbComment|null, context: ResolverContext) => {
    if (!user) return false;
    if (!document || !document.postId) return userCanDo(user, 'comments.new')
    const post = await context.loaders.Posts.load(document.postId)
    if (!post) return true

    const author = await context.loaders.Users.load(post.userId);
    const isReply = !!document.parentCommentId;
    if (!userIsAllowedToComment(user, post, author, isReply)) {
      return userCanDo(user, `posts.moderate.all`)
    }

    return userCanDo(user, 'comments.new')
  },

  editCheck: (user: DbUser|null, document: DbComment|null, context: ResolverContext) => {
    if (!user || !document) return false;
    if (userCanDo(user, 'comments.alignment.move.all') ||
        userCanDo(user, 'comments.alignment.suggest')) {
      return true
    }
    return userOwns(user, document) ? userCanDo(user, 'comments.edit.own') : userCanDo(user, `comments.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbComment|null, context: ResolverContext) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'comments.edit.own') : userCanDo(user, `comments.edit.all`)
  },
}

export const Comments = createCollection({
  collectionName: 'Comments',
  typeName: 'Comment',
    resolvers: getDefaultResolvers('Comments'),
  mutations: getDefaultMutations('Comments', commentMutationOptions),
  logChanges: true,
  voteable: commentVotingOptions,
});


export default Comments;
