import { createGroup } from './vulcan-users/permissions';

// Non-logged-in users
export const guestsGroup = createGroup('guests', [
  'posts.view.approved',
  'comments.view',
  'gardencodes.view',
]);

// Regular users
export const membersGroup = createGroup('members', [
  'advisorrequests.view.own',
  'advisorrequests.new',
  'advisorrequests.edit.own',
  'bans.view',
  "chapters.view.own",
  "chapters.new.own",
  "chapters.edit.own",
  "chapters.remove.own",
  'collections.edit.own',
  'comments.view',
  'comments.new',
  'comments.edit.own',
  'comments.remove.own',
  'comments.upvote',
  'comments.cancelUpvote',
  'comments.downvote',
  'comments.cancelDownvote',
  'comments.smallDownvote',
  'comments.bigDownvote',
  'comments.smallUpvote',
  'comments.bigUpvote',
  'conversations.new.own',
  'conversations.edit.own',
  'conversations.remove.own',
  'conversations.view.own',
  'gardencodes.new',
  'gardencodes.create',
  'gardencodes.view',
  'gardencode.update.own',
  'localgroups.new.own',
  'localgroups.edit.own',
  'localgroups.remove.own',
  'events.new.own',
  'events.view.own',
  'messages.new.own',
  'messages.edit.own',
  'messages.remove.own',
  'messages.view.own',
  'notifications.new.own',
  'notifications.edit.own',
  'notifications.view.own',
  'posts.new',
  'posts.edit.own',
  'posts.remove.own',
  'posts.upvote',
  'posts.downvote',
  'posts.smallDownvote',
  'posts.bigDownvote',
  'posts.smallUpvote',
  'posts.bigUpvote',
  'reports.new',
  'reports.view.own',
  'reviewVotes.new',
  'reviewVotes.view.own',
  'revisions.smallDownvote',
  'revisions.bigDownvote',
  'revisions.smallUpvote',
  'revisions.bigUpvote',
  'rssfeeds.new.own',
  'rssfeeds.edit.own',
  'rssfeeds.remove.own',
  'sequences.edit.own',
  'sequences.new.own',
  'sequences.remove.own',
  'chapters.new.own',
  'chapters.remote.own',
  'chapters.edit.own',
  "subscriptions.new",
  'tagrels.smallDownvote',
  'tagrels.bigDownvote',
  'tagrels.smallUpvote',
  'tagrels.bigUpvote',
  'user.create',
  'user.update.own',
  'users.new',
  'users.edit.own',
  'users.remove.own',
  'usereagdetails.view.own',
  'usereagdetails.new',
  'usereagdetails.edit.own',
  'userjobads.view.own',
  'userjobads.new',
  'userjobads.edit.own',
  'usermostvaluableposts.view.own',
  'usermostvaluableposts.new',
  'usermostvaluableposts.edit.own',
  'usermostvaluableposts.remove.own',
]);

/**
 * Admin users. These permissions are actually moot, because if you're an admin,
 * you have all permissions regardless of whether they're stated here (userCanDo
 * will always return true).
 */
export const adminsGroup = createGroup('admins', [
  'bans.new',
  'bans.edit.all',
  'bans.remove.all',
  'bans.view.all',
  'bans.remove',
  'bans.edit',
  'book.new',
  'book.edit',
  'book.remove',
  'book.edit.own',
  "chapters.view.all",
  "chapters.new.all",
  "chapters.edit.all",
  "chapters.remove.all",
  'collections.new.all',
  'collections.edit.all',
  'collections.remove.all',
  'comments.edit.all',
  'comments.remove.all',
  'conversations.new.all',
  'conversations.edit.all',
  'conversations.remove.all',
  'conversations.view.all',
  'localgroups.new.all',
  'localgroups.edit.all',
  'localgroups.remove.all',
  'events.new',
  'events.edit.all',
  'events.remove.all',
  'events.view.all',
  'messages.new.all',
  'messages.edit.all',
  'messages.remove.all',
  'messages.view.all',
  'moderationTemplates.edit.all',
  'notifications.new.all',
  'notifications.edit.all',
  'notifications.remove.all',
  'posts.view.all',
  'posts.view.pending',
  'posts.view.rejected',
  'posts.view.spam',
  'posts.view.deleted',
  'posts.new.approved',
  'posts.edit.all',
  'posts.remove.all',
  'reports.new',
  'reports.edit.all',
  'reports.remove.all',
  'reports.view.all',
  'rssfeeds.new.all',
  'rssfeeds.edit.all',
  'rssfeeds.remove.all',
  'sequences.edit.all',
  'sequences.view.all',
  'sequences.new.all',
  'setting.update',
  'settings.edit',
  'spotlights.edit.all',
  'tagFlags.new',
  'tagFlags.edit.all',
  'user.create',
  'user.update.all',
  'user.delete.all',
  'users.new',
  'users.edit.all',
  'users.remove.all',
  'usermostvaluableposts.edit.all',
  'usermostvaluableposts.remove.all',
  "userratelimits.new",
  "userratelimits.edit.all",
]);

export const sunshineRegimentGroup = createGroup("sunshineRegiment", [
  'comments.softRemove.all',
  'comments.replyOnBlocked.all',
  'comments.edit.all',
  'conversations.view.all',
  'messages.view.all',
  'moderationTemplates.edit.all',
  'posts.view.all',
  'posts.edit.all',
  'posts.curate.all',
  'posts.suggestCurate',
  'posts.frontpage.all',
  'posts.moderate.all',
  'posts.commentLock.all',
  'reviewVotes.edit.all',
  'reviewVotes.remove.all',
  'reviewVotes.view.all',
  'spotlights.edit.all',
  'userratelimits.new',
  'userratelimits.edit.all',
  'users.edit.all',
  'users.view.deleted'
]);
export const podcasters = createGroup("podcasters", []);

export const trustLevel1Group = createGroup("trustLevel1", [
  'posts.moderate.own',
  'posts.suggestCurate'
]);

export const canBypassPostRateLimitGroup = createGroup("canBypassPostRateLimit", []);
export const canModeratePersonalGroup = createGroup("canModeratePersonal", [
  'posts.moderate.own.personal'
]);
export const canCommentLockGroup = createGroup("canCommentLock", [
  'posts.commentLock.own'
]);
export const tagManagerGroup = createGroup("tagManager", []);
export const canSuggestCurationGroup = createGroup("canSuggestCuration", []);
export const debaterGroup = createGroup("debaters", []);

/**
 * Admin users can turn off their admin power, to test aspects of the site in
 * a way that accurately reflects what non-admins see (in particular, so that
 * they see any permissions-related bugs), while retaining the ability to take
 * their admin power back.
 */
export const realAdminsGroup = createGroup("realAdmins", []);

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
