import Users from 'meteor/vulcan:users';
import { Comments } from "meteor/example-forum";

const sunshineRegimentActions = [
  'comments.softRemove.all',
  'comments.replyOnBlocked.all'
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);
