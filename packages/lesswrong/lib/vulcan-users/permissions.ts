import Users from '../collections/users/collection';
import { Utils } from '../vulcan-lib';
import intersection from 'lodash/intersection';
import * as _ from 'underscore';

/**
 * @summary Users.groups object
 */
Users.groups = {};

/**
 * @summary Group class
 */
class Group {
  actions: Array<string>

  constructor() {
    this.actions = [];
  }

  can(actions) {
    actions = Array.isArray(actions) ? actions : [actions];
    this.actions = this.actions.concat(actions);
  }

  cannot(actions) {
    actions = Array.isArray(actions) ? actions : [actions];
    this.actions = _.difference(this.actions, actions);
  }
}

////////////////////
// Helpers        //
////////////////////

/**
 * @summary create a new group
 * @param {String} groupName
 */
Users.createGroup = (groupName: string): void => {
  Users.groups[groupName] = new Group();
};

/**
 * @summary get a list of a user's groups
 * @param {Object} user
 */
Users.getGroups = (user: UsersMinimumInfo|DbUser|null): Array<string> => {
  if (!user) { // guests user
    return ['guests'];
  } else {
    let userGroups: Array<string> = ['members'];

    if (user.groups) { // custom groups
      userGroups = userGroups.concat(user.groups);
    }

    if (Users.isAdmin(user)) { // admin
      userGroups.push('admins');
    }
    
    return userGroups;
  }
};

/**
 * @summary get a list of all the actions a user can perform
 * @param {Object} user
 */
Users.getActions = (user: UsersMinimumInfo|DbUser|null): Array<string> => {
  let userGroups = Users.getGroups(user);
  if (!userGroups.includes('guests')) {
    // always give everybody permission for guests actions, too
    userGroups.push('guests');
  }
  let groupActions = userGroups.map(groupName => {
    // note: make sure groupName corresponds to an actual group
    const group = Users.groups[groupName];
    return group && group.actions;
  });
  return _.unique(_.flatten(groupActions));
};

/**
 * @summary check if a user is a member of a group
 * @param {Array} user
 * @param {String} group or array of groups
 */
Users.isMemberOf = (user: UsersCurrent|DbUser|null, groupOrGroups: string|Array<string>): boolean => {
  const groups = Array.isArray(groupOrGroups) ? groupOrGroups : [groupOrGroups];
  return intersection(Users.getGroups(user), groups).length > 0;
};

/**
 * @summary check if a user can perform at least one of the specified actions
 * @param {Object} user
 * @param {String/Array} action or actions
 */
Users.canDo = (user: UsersMinimumInfo|DbUser|null, actionOrActions: string|Array<string>): boolean => {
  const authorizedActions = Users.getActions(user);
  const actions = Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions];
  return Users.isAdmin(user) || intersection(authorizedActions, actions).length > 0;
};

/**
 * @summary Check if a user owns a document
 * @param {Object|string} userOrUserId - The user or their userId
 * @param {Object} document - The document to check (post, comment, user object, etc.)
 */
Users.owns = function (user: UsersMinimumInfo|DbUser|null, document: HasUserIdType|DbUser|UsersMinimumInfo): boolean {
  if (!user) {
    // not logged in
    return false;
  }
  if (!document) {
    // no document specified
    return false;
  }
  
  if ((document as HasUserIdType).userId) {
    // case 1: document is a post or a comment, use userId to check
    return user._id === (document as HasUserIdType).userId;
  } else {
    // case 2: document is a user, use _id or slug to check
    const documentUser = document as (DbUser|UsersMinimumInfo);
    return documentUser.slug ? user.slug === documentUser.slug : user._id === documentUser._id;
  }
};

/**
 * @summary Check if a user is an admin
 * @param {Object|string} userOrUserId - The user or their userId
 */
Users.isAdmin = function (user: UsersMinimumInfo|DbUser|null): boolean {
  if (!user) return false;
  return user.isAdmin;
};

export const isAdmin = Users.isAdmin;

/**
 * @summary Check if a user can view a field
 * @param {Object} user - The user performing the action
 * @param {Object} field - The field being edited or inserted
 */
Users.canReadField = function (user: UsersCurrent|DbUser|null, field: any, document: any): boolean {
  const canRead = field.canRead || field.viewableBy; //OpenCRUD backwards compatibility
  if (canRead) {
    if (typeof canRead === 'function') {
      // if canRead is a function, execute it with user and document passed. it must return a boolean
      return canRead(user, document);
    } else if (typeof canRead === 'string') {
      // if canRead is just a string, we assume it's the name of a group and pass it to isMemberOf
      return canRead === 'guests' || Users.isMemberOf(user, canRead);
    } else if (Array.isArray(canRead) && canRead.length > 0) {
      // if canRead is an array, we do a recursion on every item and return true if one of the items return true
      return canRead.some(group => Users.canReadField(user, { canRead: group }, document));
    }
  }
  return false;
};

/**
 * @summary Get a list of fields viewable by a user
 * @param {Object} user - The user performing the action
 * @param {Object} collection - The collection
 * @param {Object} document - Optionally, get a list for a specific document
 */
Users.getViewableFields = function <T extends DbObject>(user: UsersCurrent|DbUser|null, collection: CollectionBase<T>, document: T): any {
  return Utils.arrayToFields(_.compact(_.map(collection.simpleSchema()._schema,
    (field: any, fieldName: string) => {
      if (fieldName.indexOf('.$') > -1) return null;
      return Users.canReadField(user, field, document) ? fieldName : null;
    }
  )));
};

/**
 * @summary For a given document or list of documents, keep only fields viewable by current user
 * @param {Object} user - The user performing the action
 * @param {Object} collection - The collection
 * @param {Object} document - The document being returned by the resolver
 */
// TODO: Integrate permissions-filtered DbObjects into the type system
Users.restrictViewableFields = function <T extends DbObject>(user: UsersCurrent|DbUser|null, collection: CollectionBase<T>, docOrDocs: T|Array<T>): any {
  if (!docOrDocs) return {};

  const restrictDoc = document => {
    // get array of all keys viewable by user
    const viewableKeys: Array<string> = _.keys(Users.getViewableFields(user, collection, document));
    
    // return a filtered document
    const restrictedDocument: Record<string,any> = {};
    for (let key of Object.keys(document)) {
      if (viewableKeys.includes(key))
        restrictedDocument[key] = document[key];
    }

    return restrictedDocument;
  };

  return Array.isArray(docOrDocs) ? docOrDocs.map(restrictDoc) : restrictDoc(docOrDocs);
};

/**
 * @summary Check if a user can submit a field
 * @param {Object} user - The user performing the action
 * @param {Object} field - The field being edited or inserted
 */
Users.canCreateField = function (user, field) {
  const canCreate = field.canCreate || field.insertableBy; //OpenCRUD backwards compatibility
  if (canCreate) {
    if (typeof canCreate === 'function') {
      // if canCreate is a function, execute it with user and document passed. it must return a boolean
      return canCreate(user);
    } else if (typeof canCreate === 'string') {
      // if canCreate is just a string, we assume it's the name of a group and pass it to isMemberOf
      // note: if canCreate is 'guests' then anybody can create it
      return canCreate === 'guests' || Users.isMemberOf(user, canCreate);
    } else if (Array.isArray(canCreate) && canCreate.length > 0) {
      // if canCreate is an array, we do a recursion on every item and return true if one of the items return true
      return canCreate.some(group => Users.canCreateField(user, { canCreate: group }));
    }
  }
  return false;
};

/** @function
 * Check if a user can edit a field
 * @param {Object} user - The user performing the action
 * @param {Object} field - The field being edited or inserted
 */
Users.canUpdateField = function (user, field, document) {
  const canUpdate = field.canUpdate || field.editableBy; //OpenCRUD backwards compatibility

  if (canUpdate) {
    if (typeof canUpdate === 'function') {
      // if canUpdate is a function, execute it with user and document passed. it must return a boolean
      return canUpdate(user, document);
    } else if (typeof canUpdate === 'string') {
      // if canUpdate is just a string, we assume it's the name of a group and pass it to isMemberOf
      // note: if canUpdate is 'guests' then anybody can create it
      return canUpdate === 'guests' || Users.isMemberOf(user, canUpdate);
    } else if (Array.isArray(canUpdate) && canUpdate.length > 0) {
      // if canUpdate is an array, we look at every item and return true if one of the items return true
      return canUpdate.some(group => Users.canUpdateField(user, { canUpdate: group }, document));

    }
  }
  return false;
};

////////////////////
// Initialize     //
////////////////////

/**
 * @summary initialize the 3 out-of-the-box groups
 */
Users.createGroup('guests'); // non-logged-in users
Users.createGroup('members'); // regular users

const membersActions = [
  'user.create',
  'user.update.own',
  // OpenCRUD backwards compatibility
  'users.new',
  'users.edit.own',
  'users.remove.own',
];
Users.groups.members.can(membersActions);

Users.createGroup('admins'); // admin users

const adminActions = [
  'user.create',
  'user.update.all',
  'user.delete.all',
  'setting.update',
  // OpenCRUD backwards compatibility
  'users.new',
  'users.edit.all',
  'users.remove.all',
  'settings.edit',
];
Users.groups.admins.can(adminActions);
