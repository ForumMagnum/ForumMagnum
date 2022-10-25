import { getCollection } from '../../vulcan-lib/getCollection';
import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import { userIsPostGroupOrganizer } from './helpers';
import * as _ from 'underscore';

export type CollaborativeEditingAccessLevel = "none"|"read"|"comment"|"edit";

export function strongerAccessLevel(a: CollaborativeEditingAccessLevel|null, b: CollaborativeEditingAccessLevel|null): CollaborativeEditingAccessLevel {
  if (a==="edit" || b==="edit") return "edit";
  if (a==="comment" || b==="comment") return "comment";
  if (a==="read" || b==="read") return "read";
  if (a) return a;
  if (b) return b;
  return "none";
}

export function accessLevelCan(accessLevel: CollaborativeEditingAccessLevel, operation: "read"|"comment"|"edit") {
  if (accessLevel === "edit") {
    return true;
  } else if (accessLevel === "comment") {
    return operation==="read" || operation==="comment";
  } else if (accessLevel === "read") {
    return operation==="read";
  } else if (accessLevel === "none") {
    return false;
  }
}

export async function getCollaborativeEditorAccess({formType, post, user, useAdminPowers}: {
  formType: "new"|"edit",
  post: DbPost|null,
  user: DbUser|null,
  
  // If true and the user is a moderator/admin, take their admin powers into
  // account. If false, return permissions as they would be given no moderator
  // powers.
  useAdminPowers: boolean,
}): Promise<CollaborativeEditingAccessLevel> {
  // FIXME: There's a lot of redundancy between this function and
  // canUserEditPostMetadata in lib/collections/posts/helpers.ts, but they are
  // tricky to merge because of the `useAdminPowers` flag and because
  // `canUserEditPostMetadata` can't check for group-organizer status because it
  // isn't async. This function is used for controlling access to the body
  // (getting a ckEditor token).
  
  if (formType === "new" && user && !post) {
    return "edit";
  }
  
  if (!post || !user) {
    return "none";
  }
  
  const canEditAsAdmin = useAdminPowers && userCanDo(user, 'posts.edit.all');
  const canEdit = userOwns(user, post) || canEditAsAdmin || await userIsPostGroupOrganizer(user, post);
  const canView = await getCollection("Posts").checkAccess(user, post, null);
  let accessLevel: CollaborativeEditingAccessLevel = "none";
  
  if (canEdit) {
    accessLevel = strongerAccessLevel(accessLevel, "edit");
  }
  
  accessLevel = strongerAccessLevel(accessLevel, post.sharingSettings?.anyoneWithLinkCan);
  
  if (_.contains(post.shareWithUsers, user._id)) {
    accessLevel = strongerAccessLevel(accessLevel, post.sharingSettings?.explicitlySharedUsersCan);
  }
  
  return accessLevel;
}

export interface SharingSettings {
  anyoneWithLinkCan: CollaborativeEditingAccessLevel,
  explicitlySharedUsersCan: CollaborativeEditingAccessLevel,
}
export const defaultSharingSettings: SharingSettings = {
  anyoneWithLinkCan: "none",
  explicitlySharedUsersCan: "comment",
};
