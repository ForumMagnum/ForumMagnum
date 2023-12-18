import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import { userIsAllowedToComment } from '../users/helpers';
import { mongoFindOne } from '../../mongoQueries';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { makeEditable } from '../../editor/make_editable';
import { isFriendlyUI } from '../../../themes/forumTheme';

export const commentMutationOptions: MutationOptions<DbComment> = {
  newCheck: async (user: DbUser|null, document: DbComment|null) => {
    if (!user) return false;
    if (!document || !document.postId) return userCanDo(user, 'comments.new')
    const post = await mongoFindOne("Posts", document.postId)
    if (!post) return true

    const author = await mongoFindOne("Users", post.userId);
    const isReply = !!document.parentCommentId;
    if (!userIsAllowedToComment(user, post, author, isReply)) {
      return userCanDo(user, `posts.moderate.all`)
    }

    return userCanDo(user, 'comments.new')
  },

  editCheck: (user: DbUser|null, document: DbComment|null) => {
    if (!user || !document) return false;
    if (userCanDo(user, 'comments.alignment.move.all') ||
        userCanDo(user, 'comments.alignment.suggest')) {
      return true
    }
    return userOwns(user, document) ? userCanDo(user, 'comments.edit.own') : userCanDo(user, `comments.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbComment|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'comments.edit.own') : userCanDo(user, `comments.edit.all`)
  },
}

export const Comments = createCollection({
  collectionName: 'Comments',
  typeName: 'Comment',
  schema,
  resolvers: getDefaultResolvers('Comments'),
  mutations: getDefaultMutations('Comments', commentMutationOptions),
  logChanges: true,
});

addUniversalFields({
  collection: Comments,
  createdAtOptions: {canRead: ['admins']},
});

makeEditable({
  collection: Comments,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    // Sets the algorithm for determing what storage ids to use for local storage management
    getLocalStorageId: (comment, name) => {
      if (comment._id) { return {id: comment._id, verify: true} }
      if (comment.parentCommentId) { return {id: ('parent:' + comment.parentCommentId), verify: false}}
      return {id: ('post:' + comment.postId), verify: false}
    },
    hintText: isFriendlyUI ? 'Write a new comment...' : undefined,
    order: 25,
    pingbacks: true,
  }
})

export default Comments;
