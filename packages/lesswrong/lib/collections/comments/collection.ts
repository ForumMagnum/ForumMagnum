import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userCanDo, userOwns, userIsAdmin } from '../../vulcan-users/permissions';
import { userIsAllowedToComment } from '../users/helpers';
import { mongoFindOne } from '../../mongoQueries';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

export const commentMutationOptions: MutationOptions<DbComment> = {
  newCheck: (user: DbUser|null, document: DbComment|null) => {
    if (!user) return false;

    if (!document || !document.postId) return userCanDo(user, 'comments.new')
    const post = mongoFindOne("Posts", document.postId)
    if (!post) return true

    if (!userIsAllowedToComment(user, post)) {
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

interface ExtendedCommentsCollection extends CommentsCollection {
  // Functions in server/search/utils.ts
  toAlgolia: (comment: DbComment) => Promise<Array<AlgoliaDocument>|null>
}

export const Comments: ExtendedCommentsCollection = createCollection({
  collectionName: 'Comments',
  typeName: 'Comment',
  schema,
  resolvers: getDefaultResolvers('Comments'),
  mutations: getDefaultMutations('Comments', commentMutationOptions),
});

Comments.checkAccess = async (currentUser: DbUser|null, comment: DbComment, context: ResolverContext|null): Promise<boolean> => {
  if (userIsAdmin(currentUser) || userOwns(currentUser, comment)) { // admins can always see everything, users can always see their own posts
    return true;
  } else if (comment.isDeleted) {
    return false;
  } else {
    return true;
  }
}

addUniversalFields({collection: Comments})

export default Comments;
