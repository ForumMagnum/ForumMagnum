import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Users from '../users/collection';
import { Posts } from '../posts';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

export const commentMutationOptions = {
  newCheck: (user, document) => {
    if (!user || !document) return false;
    const post = Posts.findOne(document.postId)

    if (!Users.isAllowedToComment(user, post)) {
      return Users.canDo(user, `posts.moderate.all`)
    }
    return Users.canDo(user, 'comments.new')
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    if (Users.canDo(user, 'comments.alignment.move.all') ||
        Users.canDo(user, 'comments.alignment.suggest')) {
      return true
    }
    return Users.owns(user, document) ? Users.canDo(user, 'comments.edit.own') : Users.canDo(user, `comments.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'comments.edit.own') : Users.canDo(user, `comments.edit.all`)
  },
}

interface ExtendedCommentsCollection extends CommentsCollection {
  // Functions in lib/collections/comments/helpers.ts
  getAuthorName: any
  getPageUrl: any
  getPageUrlFromIds: any
  getRSSUrl: any
  defaultToAlignment: any
  getDefaultView: any
  getKarma: any
  
  // Functions in lib/alignment-forum/comments/helpers.ts
  suggestForAlignment: any
  unSuggestForAlignment: any
  
  // Functions in server/search/utils.ts
  toAlgolia: any
}

export const Comments: ExtendedCommentsCollection = createCollection({
  collectionName: 'Comments',
  typeName: 'Comment',
  schema,
  resolvers: getDefaultResolvers('Comments'),
  mutations: getDefaultMutations('Comments', commentMutationOptions),
});

Comments.checkAccess = (currentUser, comment) => {
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
