import { adminsGroup } from "../../vulcan-users/permissions";
import { sunshineRegimentGroup } from "../../permissions";

const actions = [
  "userratelimits.new",
  "userratelimits.edit.all",
];

adminsGroup.can(actions);
sunshineRegimentGroup.can(actions);
