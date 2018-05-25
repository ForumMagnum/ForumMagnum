import { Posts } from 'meteor/example-forum'
import Users from 'meteor/vulcan:users'

Posts.checkAccess = (currentUser, post) => {
  if (Users.isAdmin(currentUser) || Users.owns(currentUser, post)) { // admins can always see everything, users can always see their own posts
    return true;
  } else if (post.isFuture || post.draft) {
    return false;
  } else {
    const status = _.findWhere(Posts.statuses, {value: post.status});
    return Users.canDo(currentUser, `posts.view.${status.label}`);
  }
}

const votingActions = [
  'posts.smallDownvote',
  'posts.bigDownvote',
  'posts.cancelSmallDownvote',
  'posts.cancelBigDownvote',
  'posts.smallUpvote',
  'posts.bigUpvote',
  'posts.cancelSmallUpvote',
  'posts.cancelBigUpvote',
]

Users.groups.members.can(votingActions);

const sunshineRegimentActions = [
  'posts.edit.all',
  'posts.curate.all',
  'posts.suggestCurate',
  'posts.frontpage.all',
  'posts.moderate.all',
  'posts.commentLock.all'
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);


Users.groups.trustLevel1.can(['posts.moderate.own', 'posts.suggestCurate']);
Users.groups.canCommentLock.can(['posts.commentLock.own']);
