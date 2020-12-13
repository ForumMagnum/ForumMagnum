import { Posts } from './collection'
import { postStatusLabels } from './constants'
import { guestsGroup, membersGroup, adminsGroup, userCanDo, userOwns } from '../../vulcan-users/permissions';
import { sunshineRegimentGroup, trustLevel1Group, canModeratePersonalGroup, canCommentLockGroup } from '../../permissions';
import { userIsSharedOn } from '../users/helpers'
import * as _ from 'underscore';

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
