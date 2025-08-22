import intersection from 'lodash/intersection';
import moment from 'moment';
import { isLW, hideUnreviewedAuthorCommentsSettings } from '../instanceSettings';
import { allUserGroupsByName } from '../permissions';

export function getAllUserGroups() {
  return allUserGroupsByName;
}

export type PermissionableUser = UsersMinimumInfo & Pick<UsersDefaultFragment,
  "groups" |
  "banned" |
  "allCommentingDisabled"
>;

// get a list of a user's groups
export const userGetGroups = (user: PermissionableUser|DbUser|null): Array<string> => {
  if (!user) { // guests user
    return ['guests'];
  }
  if (user.banned && user.banned > moment().toDate()) { // banned users have no membership permissions
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
export const userGetActions = (user: PermissionableUser|DbUser|null): Array<string> => {
  let groups = userGetGroups(user);
  if (!groups.includes('guests')) {
    // always give everybody permission for guests actions, too
    groups.push('guests');
  }
  let groupActions = groups.map(groupName => {
    // note: make sure groupName corresponds to an actual group
    const group = allUserGroupsByName[groupName];
    return group && group.actions;
  });
  return [...new Set(groupActions.flat())];
};

// Check if a user is a member of a group
export const userIsMemberOf = (user: PermissionableUser|DbUser|null, group: PermissionGroups): boolean => {
  const userGroups = userGetGroups(user);
  for (let userGroup of userGroups) {
    if (userGroup === group)
      return true;
  }
  return false;
};


export const userIsPodcaster = (user: UsersProfile|UsersCurrent|DbUser|null): boolean => {
  return userIsMemberOf(user, 'podcasters');
};

// Check if a user can perform at least one of the specified actions
export const userCanDo = (user: PermissionableUser|DbUser|null, actionOrActions: string|Array<string>): boolean => {
  const authorizedActions = userGetActions(user);
  const actions = Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions];
  return userIsAdmin(user) || intersection(authorizedActions, actions).length > 0;
};

export type OwnableDocument = HasUserIdType|DbUser|UsersMinimumInfo;

// Check if a user owns a document
export const userOwns = function (user: UsersMinimumInfo|DbUser|null, document: OwnableDocument): boolean {
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
    const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
    const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
    return idsExistAndMatch || slugsExistAndMatch;
  }
};

export const userOwnsAndOnLW = function (user: UsersMinimumInfo|DbUser|null, document: OwnableDocument): boolean {
  return isLW && userOwns(user, document)
}

export const documentIsNotDeleted = (
  user: DbUser|PermissionableUser|null,
  document: OwnableDocument,
) => {
  // Admins and mods can see deleted content
  if (userIsAdminOrMod(user)) {
    return true;
  }
  // Authors can see their deleted content
  if (userOwns(user, document)) {
    return true;
  }
  // Unfortunately, different collections use different field names
  // to represent "deleted-ness"
  return !(
    (document as unknown as DbComment).deleted ||
    (document as unknown as DbPost).deletedDraft ||
    (document as unknown as DbSequence).isDeleted
  );
}


export const userCanComment = (user: PermissionableUser|DbUser|null): boolean => {
  if (!user) {
    return false;
  }
  if (userIsAdminOrMod(user)) {
    return true;
  }
  if (user.allCommentingDisabled) {
    return false;
  }
  if (hideUnreviewedAuthorCommentsSettings.get() && !user.reviewedByUserId) {
    return false;
  }
  return true;
}

// Same as userCanComment, but without the unreviewed author check
export const userCanQuickTake = (user: PermissionableUser|DbUser|null): boolean => {
  if (!user) {
    return false;
  }

  if (userIsAdminOrMod(user)) {
    return true;
  }

  if (user.allCommentingDisabled) {
    return false;
  }

  return true;
}

export const userOverNKarmaFunc = (n: number) => {
    return (user: UsersMinimumInfo|DbUser|null): boolean => {
      if (!user) return false
      return ((user.karma) > n)
    }
}

export const userOverNKarmaOrApproved = (n: number) => {
  return (user: UsersMinimumInfo|DbUser|null): boolean => {
    if (!user) return false
    return ((user.karma) > n || !!user.reviewedByUserId)
  }
}

export const userHasntChangedName = (user: Partial<Pick<UsersProfile|DbUser, 'previousDisplayName'>> | null): boolean => {
  if (!user) return false
  return !user.previousDisplayName
}

// Check if a user is an admin
export const userIsAdmin = function <T extends UsersMinimumInfo|DbUser|null>(user: T): user is Exclude<T, null> & { isAdmin: true } {
  if (!user) return false;
  return user.isAdmin;
};

export const isAdmin = userIsAdmin;

export const userIsAdminOrMod = function <T extends PermissionableUser|DbUser|null> (user: T): boolean {
  if (!user) return false;
  return user.isAdmin || userIsMemberOf(user, 'sunshineRegiment');
};

// Check if a user can view a field
export const userCanReadField = <N extends CollectionNameString>(
  user: DbUser | null,
  canRead: FieldPermissions | undefined,
  document: ObjectsByCollectionName[N],
): boolean => {
  const userGroups = userGetGroups(user);
  if (canRead) {
    return userHasFieldPermissions(user, userGroups, canRead, document);
  }
  return false;
};

export const userHasFieldPermissions = <T extends DbObject>(
  user: DbUser|null,
  userGroups: string[],
  canRead: FieldPermissions,
  document: T
): boolean => {
  if (typeof canRead === 'string') {
    // if canRead is just a string, we assume it's the name of a group and pass it to isMemberOf
    if (canRead === 'guests') return true;
    for (let group of userGroups) {
      if (group===canRead)
        return true;
    }
    return false;
  } else if (typeof canRead === 'function') {
    // if canRead is a function, execute it with user and document passed. it must return a boolean
    return canRead(user, document);
  } else if (Array.isArray(canRead) && canRead.length > 0) {
    // if canRead is an array, we do a recursion on every item and return true if one of the items return true
    for (const group of canRead) {
      if (userHasFieldPermissions(user, userGroups, group, document)) {
        return true;
      }
    }
    return false;
  } else {
    return false;
  }
}

// Check if a user can submit a field
export const userCanCreateField = (
  user: DbUser | null,
  canCreate: FieldCreatePermissions | undefined,
): boolean => {
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
      return canCreate.some(group => userCanCreateField(user, group));
    }
  }
  return false;
};

// Check if a user can edit a field
export const userCanUpdateField = <N extends CollectionNameString>(
  user: DbUser | null,
  canUpdate: FieldPermissions | undefined,
  document: Partial<ObjectsByCollectionName[N]>,
): boolean => {
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
      return canUpdate.some(group => userCanUpdateField(user, group, document));

    }
  }
  return false;
};
