import Users from 'meteor/vulcan:users';
import { Comments } from "meteor/example-forum";

const sunshineRegimentActions = [
  'comments.softRemove.all',
  'comments.replyOnBlocked.all',
  'comments.edit.all'
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);
