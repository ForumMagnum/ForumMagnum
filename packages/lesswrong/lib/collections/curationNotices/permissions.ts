import { sunshineRegimentGroup } from "../../permissions";
import { adminsGroup } from "../../vulcan-users";

const actions = [
  'curationNotices.edit.all',
];

adminsGroup.can(actions);
sunshineRegimentGroup.can(actions)
