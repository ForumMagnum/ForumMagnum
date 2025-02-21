import { sunshineRegimentGroup } from "../../permissions";
import { adminsGroup } from "../../vulcan-users/permissions";

const actions = [
  'moderationTemplates.edit.all',
];

adminsGroup.can(actions);
sunshineRegimentGroup.can(actions)
