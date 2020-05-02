import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Users from '../users/collection';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user) => {
    if (!user) return false;
    return Users.canDo(user, 'posts.new')
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    if (Users.canDo(user, 'posts.alignment.move.all') ||
        Users.canDo(user, 'posts.alignment.suggest')) {
      return true
    }
    return Posts.canEdit(user, document)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'posts.edit.own') : Users.canDo(user, `posts.edit.all`)
  },
}

// The set of fields required for calling Posts.getPageUrl. Could be supplied by
// either a fragment or a DbPost.
export interface PostsMinimumForGetPageUrl {
  _id: string
  slug: string
  isEvent?: boolean
  groupId?: string|undefined
}

interface ExtendedPostsCollection extends PostsCollection {
  // Functions in lib/collections/posts/helpers.ts
  getLink: (post: PostsBase|DbPost, isAbsolute?: boolean, isRedirected?: boolean) => string
  getLinkTarget: (post: PostsBase|DbPost) => string
  getAuthorName: (post: DbPost) => string
  getDefaultStatus: (user: DbUser) => number
  getStatusName: (post: DbPost) => string
  isApproved: (post: DbPost) => boolean
  isPending: (post: DbPost) => boolean
  getTwitterShareUrl: (post: DbPost) => string
  getFacebookShareUrl: (post: DbPost) => string
  getEmailShareUrl: (post: DbPost) => string
  getPageUrl: (post: PostsMinimumForGetPageUrl, isAbsolute?: boolean, sequenceId?: string|null) => string
  getCommentCount: (post: PostsBase|DbPost) => number
  getCommentCountStr: (post: PostsBase|DbPost, commentCount?: number|undefined) => string
  getLastCommentedAt: (post: PostsBase|DbPost) => Date
  getLastCommentPromotedAt: (post: PostsBase|DbPost) => Date | null
  canEdit: (currentUser: UsersCurrent|DbUser|null, post: PostsBase|DbPost) => boolean
  canDelete: (currentUser: UsersCurrent|DbUser|null, post: PostsBase|DbPost) => boolean
  getKarma: (post: PostsBase|DbPost) => number
  canEditHideCommentKarma: (user: UsersCurrent|DbUser|null, post: PostsBase|DbPost) => boolean
  
  // In lib/alignment-forum/posts/helpers.ts
  suggestForAlignment: any
  unSuggestForAlignment: any
  
  // In search/utils.ts
  toAlgolia: (post: DbPost) => Array<Record<string,any>>|null
  
  // Things in lib/collections/posts/collection.ts
  config: Record<string,number>
  statuses: Array<{value: number, label: string}>
}

export const Posts: ExtendedPostsCollection = createCollection({
  collectionName: 'Posts',
  typeName: 'Post',
  schema,
  resolvers: getDefaultResolvers('Posts'),
  mutations: getDefaultMutations('Posts', options),
});

// refactor: moved here from schema.js
Posts.config = {};

Posts.config.STATUS_PENDING = 1;
Posts.config.STATUS_APPROVED = 2;
Posts.config.STATUS_REJECTED = 3;
Posts.config.STATUS_SPAM = 4;
Posts.config.STATUS_DELETED = 5;


// Post statuses
Posts.statuses = [
  {
    value: 1,
    label: 'pending'
  },
  {
    value: 2,
    label: 'approved'
  },
  {
    value: 3,
    label: 'rejected'
  },
  {
    value: 4,
    label: 'spam'
  },
  {
    value: 5,
    label: 'deleted'
  }
];

addUniversalFields({collection: Posts})

export default Posts;
