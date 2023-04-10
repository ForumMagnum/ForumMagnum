import { sunshineRegimentGroup } from "../../permissions";
import { adminsGroup } from "../../vulcan-users";

const actions = [
  'spotlights.edit.all',
];

adminsGroup.can(actions);
sunshineRegimentGroup.can(actions)
