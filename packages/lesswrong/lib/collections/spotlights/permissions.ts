import { adminsGroup } from "../../vulcan-users";

const adminActions = [
  'spotlights.edit.all',
];
adminsGroup.can(adminActions);