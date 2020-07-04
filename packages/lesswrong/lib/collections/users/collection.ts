import schema from './schema';
import resolvers from '../../vulcan-users/resolvers';
import { createCollection, addGraphQLQuery, Utils } from '../../vulcan-lib';
import { Meteor } from 'meteor/meteor';

const performCheck = (mutation, user, document) => {
  if (!mutation.check(user, document))
    throw new Error(
      Utils.encodeIntlError({ id: 'app.mutation_not_allowed', value: `"${mutation.name}" on _id "${document._id}"` })
    );
};

const createMutation = {
  name: 'createUser',

  check(user, document) {
    if (!user) return false;
    // OpenCRUD backwards compatibility
    return Users.canDo(user, ['user.create', 'users.new']);
  },

  mutation(root, { data }, context) {
    const { Users, currentUser } = context;
    performCheck(this, currentUser, data);

    return Utils.createMutator({
      collection: Users,
      data,
      currentUser,
      validate: true,
      context,
    });
  },
};

const updateMutation = {
  name: 'updateUser',

  check(user, document) {
    if (!user || !document) return false;

    if (Users.canDo(user, 'alignment.sidebar')) {
      return true
    }

    // OpenCRUD backwards compatibility
    return Users.owns(user, document) ? Users.canDo(user, ['user.update.own', 'users.edit.own']) : Users.canDo(user, ['user.update.all', 'users.edit.all']);
  },

  async mutation(root, { selector, data }, context) {
    const { Users, currentUser } = context;

    const document = await Utils.Connectors.get(Users, selector);

    if (!document) {
      throw new Error(`Could not find document to update for selector: ${JSON.stringify(selector)}`);
    }
    
    performCheck(this, currentUser, document);

    return Utils.updateMutator({
      collection: Users,
      selector,
      data,
      currentUser,
      validate: true,
      context,
    });
  },
};

const deleteMutation = {
  name: 'deleteUser',

  check(user, document) {
    if (!user || !document) return false;
    // OpenCRUD backwards compatibility
    return Users.owns(user, document) ? Users.canDo(user, ['user.delete.own', 'users.remove.own']) : Users.canDo(user, ['user.delete.all', 'users.remove.all']);
  },

  async mutation(root, { selector }, context) {

    const { Users, currentUser } = context;

    const document = await Utils.Connectors.get(Users, selector);

    if (!document) {
      throw new Error(`Could not find document to delete for selector: ${JSON.stringify(selector)}`);
    }

    performCheck(this, currentUser, document);

    return Utils.deleteMutator({
      collection: Users,
      selector,
      currentUser,
      validate: true,
      context,
    });
  },
};
const mutations = {
  create: createMutation,
  update: updateMutation,
  delete: deleteMutation,

  // OpenCRUD backwards compatibility
  new: createMutation,
  edit: updateMutation,
  remove: deleteMutation,
};

export interface UserLocation {
  lat: number,
  lng: number,
  loading: boolean,
  known: boolean,
}

interface ExtendedUsersCollection extends UsersCollection {
  // Functions from lib/collections/users/helpers.ts
  getDisplayName: (user: UsersMinimumInfo|DbUser|null) => string
  ownsAndInGroup: (group: string) => (user: DbUser, document: HasUserIdType) => boolean
  isSharedOn: (currentUser: DbUser|UsersMinimumInfo|null, document: PostsBase | DbPost) => boolean
  canCollaborate: (currentUser: UsersCurrent|null, document: PostsBase) => boolean
  canEditUsersBannedUserIds: (currentUser: DbUser|null, targetUser: DbUser) => boolean
  canModeratePost: (user: UsersMinimumInfo|DbUser|null, post: PostsBase|DbPost|null) => boolean
  canModerateComment: (user: UsersMinimumInfo|DbUser|null, post: PostsBase|DbPost|null , comment: DbComment|CommentsList) => boolean
  canCommentLock: (user: UsersCurrent|DbUser|null, post: PostsBase|DbPost) => boolean
  userIsBannedFromPost: (user: UsersMinimumInfo|DbUser, post: PostsDetails|DbPost) => boolean
  userIsBannedFromAllPosts: (user: UsersCurrent|DbUser, post: PostsBase|DbPost) => boolean
  userIsBannedFromAllPersonalPosts: (user: UsersCurrent|DbUser, post: PostsBase|DbPost) => boolean
  isAllowedToComment: (user: UsersMinimumInfo|DbUser|null, post: PostsDetails|DbPost) => boolean
  blockedCommentingReason: (user: UsersCurrent|DbUser|null, post: PostsDetails|DbPost) => string
  emailAddressIsVerified: (user: UsersCurrent|DbUser|null) => boolean
  getProfileUrl: (user: DbUser|UsersMinimumInfo|null, isAbsolute?: boolean) => string
  getProfileUrlFromSlug: (userSlug: string, isAbsolute?: boolean) => string
  useMarkdownPostEditor: (user: UsersCurrent|null) => boolean
  canEdit: any
  getLocation: (currentUser: UsersCurrent|null) => UserLocation
  getAggregateKarma: (user: DbUser) => Promise<number>
  getPostCount: (user: UsersMinimumInfo|DbUser|null) => number
  getCommentCount: (user: UsersMinimumInfo|DbUser|null) => number
  
  // From lib/alignment-forum/users/helpers.ts
  canSuggestPostForAlignment: any
  canMakeAlignmentPost: any
  
  // From lib/vulcan-users/permissions.ts
  groups: Record<string,any>
  createGroup: (groupName: string) => void
  getGroups: (user: UsersMinimumInfo|DbUser|null) => Array<string>
  getActions: (user: UsersMinimumInfo|DbUser|null) => Array<string>
  isMemberOf: (user: UsersCurrent|DbUser|null, groupOrGroups: string|Array<string>) => boolean
  canDo: (user: UsersMinimumInfo|DbUser|null, actionOrActions: string|Array<string>) => boolean
  owns: (user: UsersMinimumInfo|DbUser|null, document: HasUserIdType|UsersMinimumInfo) => boolean
  isAdmin: (user: UsersMinimumInfo|DbUser|null) => boolean
  canReadField: (user: UsersCurrent|DbUser|null, field: any, document: any) => boolean
  getViewableFields: <T extends DbObject>(user: UsersCurrent|DbUser|null, collection: CollectionBase<T>, document: T) => any
  restrictViewableFields: <T extends DbObject>(user: UsersCurrent|DbUser|null, collection: CollectionBase<T>, docOrDocs: T|Array<T>) => any
  canCreateField: any
  canUpdateField: any
  
  // From lib/vulcan-users/helpers.ts
  getUser: (userOrUserId: DbUser|string|undefined) => DbUser|null
  getUserName: (user: UsersMinimumInfo|DbUser|null) => string|null
  getDisplayNameById: (userId: string) => string
  getEditUrl: (user: DbUser|UsersMinimumInfo|null, isAbsolute?: boolean) => string
  getGitHubName: (user: DbUser) => string|null
  getEmail: (user: DbUser) => string|null
  findLast: <T extends HasCreatedAtType>(user: DbUser, collection: CollectionBase<T>, filter?: any) => T|null
  timeSinceLast: <T extends HasCreatedAtType>(user: DbUser, collection: CollectionBase<T>, filter?: any) => number
  numberOfItemsInPast24Hours: <T extends DbObject>(user: DbUser, collection: CollectionBase<T>, filter: Record<string,any>) => number
  findByEmail: (email: string) => DbUser|null
  
  // Fron search/utils.ts
  toAlgolia: (user: DbUser) => Promise<Array<Record<string,any>>|null>
}

export const Users: ExtendedUsersCollection = createCollection({
  collection: Meteor.users,
  collectionName: 'Users',
  typeName: 'User',
  schema,
  resolvers,
  mutations,
  description: 'A user object'
});

addGraphQLQuery('currentUser: User');

export default Users;
