import { createGroup } from './vulcan-users/permissions';

export const sunshineRegimentGroup = createGroup("sunshineRegiment");
export const podcasters = createGroup("podcasters");
export const trustLevel1Group = createGroup("trustLevel1");
export const canBypassPostRateLimitGroup = createGroup("canBypassPostRateLimit");
export const canModeratePersonalGroup = createGroup("canModeratePersonal");
export const canCommentLockGroup = createGroup("canCommentLock");
export const tagManagerGroup = createGroup("tagManager");
export const canSuggestCurationGroup = createGroup("canSuggestCuration");
export const debaterGroup = createGroup("debaters");

/**
 * Admin users can turn off their admin power, to test aspects of the site in
 * a way that accurately reflects what non-admins see (in particular, so that
 * they see any permissions-related bugs), while retaining the ability to take
 * their admin power back.
 */
export const realAdminsGroup = createGroup("realAdmins");

// This is referenced by the schema so you must run `yarn generate` after
// updating it
export const permissionGroups = [
  'guests',
  'members',
  'admins',
  'sunshineRegiment',
  'alignmentForumAdmins',
  'alignmentForum',
  'alignmentVoters',
  'podcasters',
  'canBypassPostRateLimit',
  'trustLevel1',
  'canModeratePersonal',
  'canSuggestCuration',
  'debaters',
  'realAdmins',
] as const;
