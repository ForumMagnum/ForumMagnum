import orderBy from 'lodash/orderBy';
import keyBy from 'lodash/keyBy';

class UserGroup {
  name: string
  actions: Array<string>

  constructor(name: string, actions: string[]) {
    this.name = name;
    this.actions = actions;
  }
}

// All users (including logged out)
export const guestsGroup = new UserGroup('guests', [
  'comments.view',
  'gardencodes.view',
  'posts.view.approved',
]);

// All logged-in users
export const membersGroup = new UserGroup('members', [
  'user.create',
  'user.update.own',
  // OpenCRUD backwards compatibility
  'users.new',
  'users.edit.own',
  'users.remove.own',

  'advisorrequests.view.own',
  'advisorrequests.new',
  'advisorrequests.edit.own',
  'bans.view',
  'book.edit.own',
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
  'multidocuments.smallDownvote',
  'multidocuments.bigDownvote',
  'multidocuments.smallUpvote',
  'multidocuments.bigUpvote',
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
  'tags.smallDownvote',
  'tags.bigDownvote',
  'tags.smallUpvote',
  'tags.bigUpvote',
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

export const adminsGroup = new UserGroup('admins', [
  'user.create',
  'user.update.all',
  'user.delete.all',
  'setting.update',
  // OpenCRUD backwards compatibility
  'users.new',
  'users.edit.all',
  'users.remove.all',
  'settings.edit',

  'bans.new',
  'bans.edit.all',
  'bans.remove.all',
  'bans.view.all',
  'bans.remove',
  'bans.edit',
  'book.new',
  'book.edit',
  'book.remove',
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
  'rssfeeds.new.all',
  'rssfeeds.edit.all',
  'rssfeeds.remove.all',
  'sequences.edit.all',
  'sequences.view.all',
  'sequences.new.all',
  'spotlights.edit.all',
  'tagFlags.new',
  'tagFlags.edit.all',
  'usermostvaluableposts.edit.all',
  'usermostvaluableposts.remove.all',
  "userratelimits.new",
  "userratelimits.edit.all",
]);

export const sunshineRegimentGroup = new UserGroup("sunshineRegiment", [
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
  'reports.new',
  'reports.edit.all',
  'reports.remove.all',
  'reports.view.all',
  'reviewVotes.edit.all',
  'reviewVotes.remove.all',
  'reviewVotes.view.all',
  'spotlights.edit.all',
  "userratelimits.new",
  "userratelimits.edit.all",
  'users.edit.all',
  'users.view.deleted'
]);

export const podcasters = new UserGroup("podcasters", []);

export const trustLevel1Group = new UserGroup("trustLevel1", [
  'posts.moderate.own',
  'posts.suggestCurate'
]);

export const canBypassPostRateLimitGroup = new UserGroup("canBypassPostRateLimit", []);

export const canModeratePersonalGroup = new UserGroup("canModeratePersonal", [
  'posts.moderate.own.personal'
]);

export const canCommentLockGroup = new UserGroup("canCommentLock", [
  'posts.commentLock.own'
]);

export const tagManagerGroup = new UserGroup("tagManager", []);
export const canSuggestCurationGroup = new UserGroup("canSuggestCuration", []);
export const debaterGroup = new UserGroup("debaters", []);

/**
 * Admin users can turn off their admin power, to test aspects of the site in
 * a way that accurately reflects what non-admins see (in particular, so that
 * they see any permissions-related bugs), while retaining the ability to take
 * their admin power back.
 */
export const realAdminsGroup = new UserGroup("realAdmins", []);

const alignmentVotersGroup = new UserGroup("alignmentVoters", [
  'votes.alignment',
]);

const alignmentForumGroup = new UserGroup("alignmentForum", [
  'votes.alignment',
  'posts.alignment.new',
  'posts.alignment.move',
  'posts.alignment.suggest',
  'comments.alignment.new',
  'comments.alignment.move.all',
  'comments.alignment.suggest',
]);

const alignmentForumAdminsGroup = new UserGroup("alignmentForumAdmins", [
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

export const allUserGroups = [
  guestsGroup,
  membersGroup,
  adminsGroup,
  sunshineRegimentGroup,
  podcasters,
  trustLevel1Group,
  canBypassPostRateLimitGroup,
  canModeratePersonalGroup,
  canCommentLockGroup,
  tagManagerGroup,
  canSuggestCurationGroup,
  debaterGroup,
  realAdminsGroup,
  alignmentVotersGroup,
  alignmentForumGroup,
  alignmentForumAdminsGroup,
];

export const allUserGroupsByName = keyBy(allUserGroups, g=>g.name);

