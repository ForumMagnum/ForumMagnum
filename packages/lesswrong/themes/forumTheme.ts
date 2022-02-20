import { forumTypeSetting } from "../lib/instanceSettings";
import afTheme from "../themes/alignmentForumTheme";
import eaTheme from "../themes/eaTheme";
import lwTheme from "../themes/lesswrongTheme";
import pfTheme from "../themes/pfTheme";

let forumTheme;
switch (forumTypeSetting.get()) {
  case "AlignmentForum":
    forumTheme = afTheme;
    break;
  case "EAForum":
    forumTheme = eaTheme;
    break;
  case "ProgressForum":
    forumTheme = pfTheme;
    break;
  default:
    forumTheme = lwTheme;
}

const forumThemeExport = forumTheme;

export default forumThemeExport;
