import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userCanDo, userOwns, userIsAdmin } from '../../vulcan-users/permissions';
import { userIsAllowedToComment } from '../users/helpers';
import { mongoFindOne } from '../../mongoQueries';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

export const commentMutationOptions: MutationOptions<DbComment> = {
  newCheck: async (user: DbUser|null, document: DbComment|null) => {
    if (!user) return false;

    if (user.bannedFromCommenting) return false

    if (!document || !document.postId) return userCanDo(user, 'comments.new')
    const post = await mongoFindOne("Posts", document.postId)
    if (!post) return true

    const author = await mongoFindOne("Users", post.userId);
    if (!userIsAllowedToComment(user, post, author)) {
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
  logChanges: true,
});

Comments.checkAccess = async (currentUser: DbUser|null, comment: DbComment, context: ResolverContext|null): Promise<boolean> => {
  if (userIsAdmin(currentUser) || userOwns(currentUser, comment)) { // admins can always see everything, users can always see their own posts
    return true;
  } else {
    return true;
  }
  
  // NOTE: There used to be a special case here that would deny access (to non-
  // admins) if comment.isDeleted was true. This was wrong in two cancelling
  // ways: first, because we show UI on post pages indicating that a deleted
  // comment used to be there, and denying access would hide that UI. And
  // second, because the field is named `deleted`, not named `isDeleted`.
  //
  // What we ought to be doing is blocking access to specific fields (ie the
  // contents field) if the comment is deleted and the user has access, but
  // that's more complicated and we're not currently doing that. This means that
  // sophisticated users can recover the contents of deleted comments. OTOH most
  // deleted comments are getting saved by archive.org and in RSS readers
  // anyways, so I'm not sure that matters much.
}

addUniversalFields({collection: Comments})

export default Comments;
