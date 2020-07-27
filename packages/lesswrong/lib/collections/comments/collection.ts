import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Users from '../users/collection';
import { Posts } from '../posts';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

export const commentMutationOptions = {
  newCheck: (user, document) => {
    if (!user) return false;

    if (!document || !document.postId) return Users.canDo(user, 'comments.new')
    const post = Posts.findOne(document.postId)
    if (!post) return true

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
  getAuthorName: (comment: DbComment) => string
  getPageUrl: (comment: CommentsList|DbComment, isAbsolute?: boolean) => string
  getPageUrlFromIds: (args: { postId?: string, postSlug?: string, tagSlug?: string, commentId: string, permalink?: boolean, isAbsolute?: boolean }) => string
  getRSSUrl: (comment: HasIdType, isAbsolute?: boolean) => string
  defaultToAlignment: (currentUser: UsersCurrent|null, post: PostsMinimumInfo|undefined, comment?: CommentsList) => boolean
  getDefaultView: (post: PostsDetails|DbPost|null, currentUser: UsersCurrent|null) => string
  getKarma: (comment: CommentsList|DbComment) => number
  
  // Functions in lib/alignment-forum/comments/helpers.ts
  suggestForAlignment: any
  unSuggestForAlignment: any
  
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
