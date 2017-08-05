import Votes from './collection.js';

const guestsActions = [
  "votes.view.own",
  "votes.view.all",
];
Users.groups.guests.can(guestsActions);

const membersActions = [
  //"votes.view.deleted.own",
  "votes.new",
  "votes.edit.own",
  "votes.remove.own",
];
Users.groups.members.can(membersActions);

const adminActions = [
  "votes.edit.all",
  "votes.remove.all",
];
Users.groups.admins.can(adminActions);
