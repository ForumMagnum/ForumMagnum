import { createGroup } from './vulcan-users/permissions';

// initialize the 3 out-of-the-box groups
export const guestsGroup = createGroup('guests'); // non-logged-in users
export const membersGroup = createGroup('members'); // regular users

membersGroup.can([
  'user.create',
  'user.update.own',
  // OpenCRUD backwards compatibility
  'users.new',
  'users.edit.own',
  'users.remove.own',
]);

export const adminsGroup = createGroup('admins'); // admin users

adminsGroup.can([
  'user.create',
  'user.update.all',
  'user.delete.all',
  'setting.update',
  // OpenCRUD backwards compatibility
  'users.new',
  'users.edit.all',
  'users.remove.all',
  'settings.edit',
]);

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

const alignmentVotersGroup = createGroup("alignmentVoters");
const alignmentForumGroup = createGroup("alignmentForum");
const alignmentForumAdminsGroup = createGroup("alignmentForumAdmins");

alignmentVotersGroup.can([
  'votes.alignment',
]);

alignmentForumGroup.can([
  'votes.alignment',
  'posts.alignment.new',
  'posts.alignment.move',
  'posts.alignment.suggest',
  'comments.alignment.new',
  'comments.alignment.move.all',
  'comments.alignment.suggest',
]);

alignmentForumAdminsGroup.can([
  'posts.alignment.move.all',
  'alignment.sidebar',
]);


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

membersGroup.can([
  'advisorrequests.view.own',
  'advisorrequests.new',
  'advisorrequests.edit.own',
]);

membersGroup.can([
  'bans.view',
]);

adminsGroup.can([
  'bans.new',
  'bans.edit.all',
  'bans.remove.all',
  'bans.view.all',
  'bans.remove',
  'bans.edit',
]);

adminsGroup.can([
  'book.new',
  'book.edit',
  'book.remove'
]);

membersGroup.can([
  'book.edit.own',
]);


membersGroup.can([
  "chapters.view.own",
  "chapters.new.own",
  "chapters.edit.own",
  "chapters.remove.own",
]);

adminsGroup.can([
  "chapters.view.all",
  "chapters.new.all",
  "chapters.edit.all",
  "chapters.remove.all",
]);

adminsGroup.can([
  'collections.new.all',
  'collections.edit.all',
  'collections.remove.all'
]);

membersGroup.can([
  'collections.edit.own',
]);

guestsGroup.can([
  'comments.view'
]);

membersGroup.can([
  'comments.view',
  'comments.new',
  'comments.edit.own',
  'comments.remove.own',
  'comments.upvote',
  'comments.cancelUpvote',
  'comments.downvote',
  'comments.cancelDownvote'
]);

adminsGroup.can([
  'comments.edit.all',
  'comments.remove.all'
]);

sunshineRegimentGroup.can([
  'comments.softRemove.all',
  'comments.replyOnBlocked.all',
  'comments.edit.all'
]);

membersGroup.can([
  'comments.smallDownvote',
  'comments.bigDownvote',
  'comments.smallUpvote',
  'comments.bigUpvote',
]);

membersGroup.can([
  'conversations.new.own',
  'conversations.edit.own',
  'conversations.remove.own',
  'conversations.view.own',
]);

adminsGroup.can([
  'conversations.new.all',
  'conversations.edit.all',
  'conversations.remove.all',
  'conversations.view.all',
]);

sunshineRegimentGroup.can([
  'conversations.view.all'
]);

guestsGroup.can([
  'gardencodes.view'
])

membersGroup.can([
  'gardencodes.new',
  'gardencodes.create',
  'gardencodes.view',
  'gardencode.update.own'
])

membersGroup.can([
  'localgroups.new.own',
  'localgroups.edit.own',
  'localgroups.remove.own',
]);

adminsGroup.can([
  'localgroups.new.all',
  'localgroups.edit.all',
  'localgroups.remove.all',
]);

membersGroup.can([
  'events.new.own',
  'events.view.own',
]);

adminsGroup.can([
  'events.new',
  'events.edit.all',
  'events.remove.all',
  'events.view.all',
]);

membersGroup.can([
  'messages.new.own',
  'messages.edit.own',
  'messages.remove.own',
  'messages.view.own',
]);

adminsGroup.can([
  'messages.new.all',
  'messages.edit.all',
  'messages.remove.all',
  'messages.view.all',
]);

sunshineRegimentGroup.can([
  'messages.view.all',
]);

adminsGroup.can([
  'moderationTemplates.edit.all',
]);

sunshineRegimentGroup.can([
  'moderationTemplates.edit.all',
])

membersGroup.can([
  'multidocuments.smallDownvote',
  'multidocuments.bigDownvote',
  'multidocuments.smallUpvote',
  'multidocuments.bigUpvote',
]);

membersGroup.can([
  'notifications.new.own',
  'notifications.edit.own',
  'notifications.view.own',
]);

adminsGroup.can([
  'notifications.new.all',
  'notifications.edit.all',
  'notifications.remove.all',
]);

guestsGroup.can([
  'posts.view.approved'
]);

membersGroup.can([
  'posts.new',
  'posts.edit.own',
  'posts.remove.own',
  'posts.upvote',
  'posts.downvote',
]);

adminsGroup.can([
  'posts.view.all',
  'posts.view.pending',
  'posts.view.rejected',
  'posts.view.spam',
  'posts.view.deleted',
  'posts.new.approved',
  'posts.edit.all',
  'posts.remove.all'
]);

membersGroup.can([
  'posts.smallDownvote',
  'posts.bigDownvote',
  'posts.smallUpvote',
  'posts.bigUpvote',
]);

sunshineRegimentGroup.can([
  'posts.view.all',
  'posts.edit.all',
  'posts.curate.all',
  'posts.suggestCurate',
  'posts.frontpage.all',
  'posts.moderate.all',
  'posts.commentLock.all'
]);

trustLevel1Group.can(['posts.moderate.own', 'posts.suggestCurate']);
canModeratePersonalGroup.can(['posts.moderate.own.personal']);
canCommentLockGroup.can(['posts.commentLock.own']);

membersGroup.can([
  'reports.new',
  'reports.view.own',
]);

sunshineRegimentGroup.can([
  'reports.new',
  'reports.edit.all',
  'reports.remove.all',
  'reports.view.all',
]);


membersGroup.can([
  'reviewVotes.new',
  'reviewVotes.view.own',
]);

sunshineRegimentGroup.can([
  'reviewVotes.edit.all',
  'reviewVotes.remove.all',
  'reviewVotes.view.all',
]);

membersGroup.can([
  'revisions.smallDownvote',
  'revisions.bigDownvote',
  'revisions.smallUpvote',
  'revisions.bigUpvote',
]);

membersGroup.can([
  'rssfeeds.new.own',
  'rssfeeds.edit.own',
  'rssfeeds.remove.own',
]);

adminsGroup.can([
  'rssfeeds.new.all',
  'rssfeeds.edit.all',
  'rssfeeds.remove.all',
]);

membersGroup.can([
  'sequences.edit.own',
  'sequences.new.own',
  'sequences.remove.own',
  'chapters.new.own',
  'chapters.remote.own',
  'chapters.edit.own',
]);

adminsGroup.can([
  'sequences.edit.all',
  'sequences.view.all',
  'sequences.new.all'
]);

adminsGroup.can([
  'spotlights.edit.all',
]);
sunshineRegimentGroup.can([
  'spotlights.edit.all',
])

membersGroup.can([
  "subscriptions.new"
]);

adminsGroup.can([
  'tagFlags.new',
  'tagFlags.edit.all',
]);

membersGroup.can([
  'tagrels.smallDownvote',
  'tagrels.bigDownvote',
  'tagrels.smallUpvote',
  'tagrels.bigUpvote',
]);

membersGroup.can([
  'tags.smallDownvote',
  'tags.bigDownvote',
  'tags.smallUpvote',
  'tags.bigUpvote',
]);

membersGroup.can([
  'usereagdetails.view.own',
  'usereagdetails.new',
  'usereagdetails.edit.own',
]);

membersGroup.can([
  'userjobads.view.own',
  'userjobads.new',
  'userjobads.edit.own',
]);

membersGroup.can([
  'usermostvaluableposts.view.own',
  'usermostvaluableposts.new',
  'usermostvaluableposts.edit.own',
  'usermostvaluableposts.remove.own',
]);

adminsGroup.can([
  'usermostvaluableposts.edit.all',
  'usermostvaluableposts.remove.all'
]);

adminsGroup.can([
  "userratelimits.new",
  "userratelimits.edit.all",
]);

sunshineRegimentGroup.can([
  "userratelimits.new",
  "userratelimits.edit.all",
]);

sunshineRegimentGroup.can([
  'users.edit.all',
  'users.view.deleted'
]);
