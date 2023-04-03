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
] as const;
