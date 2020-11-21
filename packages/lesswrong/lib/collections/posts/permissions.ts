import { Posts } from './collection'
import { postStatusLabels } from './constants'
import { userGroups, userCanDo, userOwns } from '../../vulcan-users/permissions';
import { userIsSharedOn } from '../users/helpers'
import * as _ from 'underscore';

// Example Forum permissions

const guestsActions = [
  'posts.view.approved'
];
userGroups.guests.can(guestsActions);

const membersActions = [
  'posts.new',
  'posts.edit.own',
  'posts.remove.own',
  'posts.upvote',
  'posts.downvote',
];
userGroups.members.can(membersActions);

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
userGroups.admins.can(adminActions);

// LessWrong Permissions

Posts.checkAccess = async (currentUser: DbUser|null, post: DbPost, context: ResolverContext|null): Promise<boolean> => {
  if (userCanDo(currentUser, 'posts.view.all')) {
    return true
  } else if (userOwns(currentUser, post) || userIsSharedOn(currentUser, post)) {
    return true;
  } else if (post.isFuture || post.draft) {
    return false;
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

userGroups.members.can(votingActions);

const sunshineRegimentActions = [
  'posts.view.all',
  'posts.edit.all',
  'posts.curate.all',
  'posts.suggestCurate',
  'posts.frontpage.all',
  'posts.moderate.all',
  'posts.commentLock.all'
];
userGroups.sunshineRegiment.can(sunshineRegimentActions);


userGroups.trustLevel1.can(['posts.moderate.own', 'posts.suggestCurate']);
userGroups.canModeratePersonal.can(['posts.moderate.own.personal']);
userGroups.canCommentLock.can(['posts.commentLock.own']);
