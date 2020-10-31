import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Users from '../users/collection';
import { Posts } from '../posts';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

export const commentMutationOptions = {
  newCheck: (user: DbUser|null, document: DbComment|null) => {
    if (!user) return false;

    if (!document || !document.postId) return Users.canDo(user, 'comments.new')
    const post = Posts.findOne(document.postId)
    if (!post) return true

    if (!Users.isAllowedToComment(user, post)) {
      return Users.canDo(user, `posts.moderate.all`)
    }

    return Users.canDo(user, 'comments.new')
  },

  editCheck: (user: DbUser|null, document: DbComment|null) => {
    if (!user || !document) return false;
    if (Users.canDo(user, 'comments.alignment.move.all') ||
        Users.canDo(user, 'comments.alignment.suggest')) {
      return true
    }
    return Users.owns(user, document) ? Users.canDo(user, 'comments.edit.own') : Users.canDo(user, `comments.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbComment|null) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'comments.edit.own') : Users.canDo(user, `comments.edit.all`)
  },
}

interface ExtendedCommentsCollection extends CommentsCollection {
  // Functions in server/search/utils.ts
  toAlgolia: (comment: DbComment) => Promise<Array<Record<string,any>>|null>
}

export const Comments: ExtendedCommentsCollection = createCollection({
  collectionName: 'Comments',
  typeName: 'Comment',
  schema,
  resolvers: getDefaultResolvers('Comments'),
  mutations: getDefaultMutations('Comments', commentMutationOptions),
});

Comments.checkAccess = async (currentUser: DbUser|null, comment: DbComment, context: ResolverContext|null): Promise<boolean> => {
  if (Users.isAdmin(currentUser) || Users.owns(currentUser, comment)) { // admins can always see everything, users can always see their own posts
    return true;
  } else if (comment.isDeleted) {
    return false;
  } else {
    return true;
  }
}

addUniversalFields({collection: Comments})

export default Comments;
