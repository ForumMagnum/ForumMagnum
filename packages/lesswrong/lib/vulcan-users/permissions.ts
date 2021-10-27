import intersection from 'lodash/intersection';
import moment from 'moment';
import * as _ from 'underscore';
import { getSchema } from'../utils/getSchema';

class Group {
  actions: Array<string>

  constructor() {
    this.actions = [];
  }

  can(actions: string|string[]) {
    actions = Array.isArray(actions) ? actions : [actions];
    this.actions = this.actions.concat(actions);
  }

  cannot(actions: string|string[]) {
    actions = Array.isArray(actions) ? actions : [actions];
    this.actions = _.difference(this.actions, actions);
  }
}

export const userGroups: Record<string,Group> = {};


// Create a new group
export const createGroup = (groupName: string): Group => {
  userGroups[groupName] = new Group();
  return userGroups[groupName];
};

// get a list of a user's groups
export const userGetGroups = (user: UsersProfile|DbUser|null): Array<string> => {
  if (!user) { // guests user
    return ['guests'];
  }
  if (user.banned > moment().toDate()) { // banned users have no membership permissions
    return ['guests'];
  }
  let userGroups: Array<string> = ['members'];

  if (user.groups) { // custom groups
    userGroups = userGroups.concat(user.groups);
  }

  if (userIsAdmin(user)) { // admin
    userGroups.push('admins');
  }
  
  return userGroups;
};

// Get a list of all the actions a user can perform
export const userGetActions = (user: UsersProfile|DbUser|null): Array<string> => {
  let groups = userGetGroups(user);
  if (!groups.includes('guests')) {
    // always give everybody permission for guests actions, too
    groups.push('guests');
  }
  let groupActions = groups.map(groupName => {
    // note: make sure groupName corresponds to an actual group
    const group = userGroups[groupName];
    return group && group.actions;
  });
  return _.unique(_.flatten(groupActions));
};

// Check if a user is a member of a group
export const userIsMemberOf = (user: UsersCurrent|UsersProfile|DbUser|null, group: string): boolean => {
  const userGroups = userGetGroups(user);
  for (let userGroup of userGroups) {
    if (userGroup === group)
      return true;
  }
  return false;
};

// Check if a user can perform at least one of the specified actions
export const userCanDo = (user: UsersProfile|DbUser|null, actionOrActions: string|Array<string>): boolean => {
  const authorizedActions = userGetActions(user);
  const actions = Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions];
  return userIsAdmin(user) || intersection(authorizedActions, actions).length > 0;
};

// Check if a user owns a document
export const userOwns = function (user: UsersMinimumInfo|DbUser|null, document: HasUserIdType|DbUser|UsersMinimumInfo|DbObject): boolean {
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

// Check if a user is an admin
export const userIsAdmin = function (user: UsersMinimumInfo|DbUser|null): boolean {
  if (!user) return false;
  return user.isAdmin;
};

export const isAdmin = userIsAdmin;

// Check if a user can view a field
export const userCanReadField = <T extends DbObject>(user: UsersCurrent|DbUser|null, field: CollectionFieldSpecification<T>, document: T): boolean => {
  const canRead = field.canRead || field.viewableBy; //OpenCRUD backwards compatibility
  if (canRead) {
    if (typeof canRead === 'function') {
      // if canRead is a function, execute it with user and document passed. it must return a boolean
      return canRead(user, document);
    } else if (typeof canRead === 'string') {
      // if canRead is just a string, we assume it's the name of a group and pass it to isMemberOf
      return canRead === 'guests' || userIsMemberOf(user, canRead);
    } else if (Array.isArray(canRead) && canRead.length > 0) {
      // if canRead is an array, we do a recursion on every item and return true if one of the items return true
      return canRead.some(group => userCanReadField(user, { canRead: group }, document));
    }
  }
  return false;
};

// @summary Get a list of fields viewable by a user
// @param {Object} user - The user performing the action
// @param {Object} collection - The collection
// @param {Object} document - Optionally, get a list for a specific document
const getViewableFields = function <T extends DbObject>(user: UsersCurrent|DbUser|null, collection: CollectionBase<T>, document: T): Set<string> {
  const schema = getSchema(collection);
  let result: Set<string> = new Set();
  for (let fieldName of Object.keys(schema)) {
    if (fieldName.indexOf('.$') > -1)
      continue;
    if (userCanReadField(user, schema[fieldName], document))
      result.add(fieldName);
  }
  return result;
};

// For a given document or list of documents, keep only fields viewable by current user
// @param {Object} user - The user performing the action
// @param {Object} collection - The collection
// @param {Object} document - The document being returned by the resolver
// TODO: Integrate permissions-filtered DbObjects into the type system
export const restrictViewableFields = function <T extends DbObject>(user: UsersCurrent|DbUser|null, collection: CollectionBase<T>, docOrDocs: T|Array<T>): any {
  if (!docOrDocs) return {};

  const restrictDoc = (document: T) => {
    // get array of all keys viewable by user
    const viewableKeys: Set<string> = getViewableFields(user, collection, document);
    
    // return a filtered document
    const restrictedDocument: Record<string,any> = {};
    for (let key of Object.keys(document)) {
      if (viewableKeys.has(key))
        restrictedDocument[key] = (document as any)[key];
    }

    return restrictedDocument;
  };

  return Array.isArray(docOrDocs) ? docOrDocs.map(restrictDoc) : restrictDoc(docOrDocs);
};

// Check if a user can submit a field
export const userCanCreateField = <T extends DbObject>(user: DbUser|UsersCurrent|null, field: CollectionFieldSpecification<T>): boolean => {
  const canCreate = field.canCreate || field.insertableBy; //OpenCRUD backwards compatibility
  if (canCreate) {
    if (typeof canCreate === 'function') {
      // if canCreate is a function, execute it with user and document passed. it must return a boolean
      return canCreate(user);
    } else if (typeof canCreate === 'string') {
      // if canCreate is just a string, we assume it's the name of a group and pass it to isMemberOf
      // note: if canCreate is 'guests' then anybody can create it
      return canCreate === 'guests' || userIsMemberOf(user, canCreate);
    } else if (Array.isArray(canCreate) && canCreate.length > 0) {
      // if canCreate is an array, we do a recursion on every item and return true if one of the items return true
      return canCreate.some(group => userCanCreateField(user, { canCreate: group }));
    }
  }
  return false;
};

// Check if a user can edit a field
export const userCanUpdateField = <T extends DbObject>(user: DbUser|UsersCurrent|null, field: CollectionFieldSpecification<T>, document: Partial<T>): boolean => {
  const canUpdate = field.canUpdate || field.editableBy; //OpenCRUD backwards compatibility

  if (canUpdate) {
    if (typeof canUpdate === 'function') {
      // if canUpdate is a function, execute it with user and document passed. it must return a boolean
      return canUpdate(user, document);
    } else if (typeof canUpdate === 'string') {
      // if canUpdate is just a string, we assume it's the name of a group and pass it to isMemberOf
      // note: if canUpdate is 'guests' then anybody can create it
      return canUpdate === 'guests' || userIsMemberOf(user, canUpdate);
    } else if (Array.isArray(canUpdate) && canUpdate.length > 0) {
      // if canUpdate is an array, we look at every item and return true if one of the items return true
      return canUpdate.some(group => userCanUpdateField(user, { canUpdate: group }, document));

    }
  }
  return false;
};

////////////////////
// Initialize     //
////////////////////

// initialize the 3 out-of-the-box groups
export const guestsGroup = createGroup('guests'); // non-logged-in users
export const membersGroup = createGroup('members'); // regular users

const membersActions = [
  'user.create',
  'user.update.own',
  // OpenCRUD backwards compatibility
  'users.new',
  'users.edit.own',
  'users.remove.own',
];
userGroups.members.can(membersActions);

export const adminsGroup = createGroup('admins'); // admin users

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
userGroups.admins.can(adminActions);
