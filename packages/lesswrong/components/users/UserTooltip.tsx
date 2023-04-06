import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";

const UserTooltip = isEAForum ? Components.EAUserTooltip : Components.LWUserTooltip;

const UserTooltipComponent = registerComponent("UserTooltip", UserTooltip);

declare global {
  interface ComponentTypes {
    UserTooltip: typeof UserTooltipComponent
  }
}
