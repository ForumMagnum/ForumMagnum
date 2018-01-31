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

const sunshineRegimentActions = [
  'posts.edit.all',
  'posts.curate.all',
  'posts.frontpage.all',
  'posts.moderate.all'
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);


const trustLevel1Actions = [
  'posts.moderate.own',
];
Users.groups.trustLevel1.can(trustLevel1Actions);
