import { Posts } from './collection'
import { postStatusLabels } from './constants'
import { guestsGroup, membersGroup, adminsGroup, userCanDo, userOwns } from '../../vulcan-users/permissions';
import { sunshineRegimentGroup, trustLevel1Group, canModeratePersonalGroup, canCommentLockGroup } from '../../permissions';
import { userIsSharedOn } from '../users/helpers'
import * as _ from 'underscore';
import { userIsPostGroupOrganizer } from './helpers';
import { getSharingKeyFromContext } from './collabEditingPermissions';
import { constantTimeCompare } from '../../helpers';

const guestsActions = [
  'posts.view.approved'
];
guestsGroup.can(guestsActions);

const membersActions = [
  'posts.new',
  'posts.edit.own',
  'posts.remove.own',
  'posts.upvote',
  'posts.downvote',
];
membersGroup.can(membersActions);

const adminActions = [
  'posts.view.all',
  'posts.view.pending',
  'posts.view.rejected',
  'posts.view.spam',
  'posts.view.deleted',
  'posts.new.approved',
  'posts.edit.all',
  'posts.remove.all'
];
adminsGroup.can(adminActions);

// LessWrong Permissions

Posts.checkAccess = async (currentUser: DbUser|null, post: DbPost, context: ResolverContext|null, outReasonDenied: {reason?: string}): Promise<boolean> => {
  const canonicalLinkSharingKey = post.linkSharingKey;
  const unvalidatedLinkSharingKey = getSharingKeyFromContext(context);

  if (post.onlyVisibleToLoggedIn && !currentUser) {
    if (outReasonDenied)
      outReasonDenied.reason = "This post is only visible to logged-in users.";
    return false;
  }
  if (userCanDo(currentUser, 'posts.view.all')) {
    return true
  } else if (userOwns(currentUser, post) || userIsSharedOn(currentUser, post) || await userIsPostGroupOrganizer(currentUser, post, context)) {
    return true;
  } else if (!currentUser && !!canonicalLinkSharingKey && constantTimeCompare({ correctValue: canonicalLinkSharingKey, unknownValue: unvalidatedLinkSharingKey })) {
    return true;
  } else if (post.isFuture || post.draft || post.deletedDraft) {
    return false;
    // TODO: consider getting rid of this clause entirely and instead just relying on default view filter, 
    // since LW is now allowing people to see rejected content and preventing them from seeing 'not-yet-rejected
    // content is kinda weird)
  } else if (post.authorIsUnreviewed && !post.rejected) {
    return false
  } else {
    const status = _.findWhere(postStatusLabels, {value: post.status});
    if (!status) return false;
    return userCanDo(currentUser, `posts.view.${status.label}`);
  }
}

const votingActions = [
  'posts.smallDownvote',
  'posts.bigDownvote',
  'posts.smallUpvote',
  'posts.bigUpvote',
]

membersGroup.can(votingActions);

const sunshineRegimentActions = [
  'posts.view.all',
  'posts.edit.all',
  'posts.curate.all',
  'posts.suggestCurate',
  'posts.frontpage.all',
  'posts.moderate.all',
  'posts.commentLock.all'
];
sunshineRegimentGroup.can(sunshineRegimentActions);


trustLevel1Group.can(['posts.moderate.own', 'posts.suggestCurate']);
canModeratePersonalGroup.can(['posts.moderate.own.personal']);
canCommentLockGroup.can(['posts.commentLock.own']);
