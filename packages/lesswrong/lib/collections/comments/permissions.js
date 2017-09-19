import Users from 'meteor/vulcan:users';
import { Comments } from "meteor/example-forum";

const sunshineRegimentActions = [
  'notifications.softRemove.all',
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);