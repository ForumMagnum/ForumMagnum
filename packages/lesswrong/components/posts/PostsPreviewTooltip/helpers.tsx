import { isFriendlyUI } from "../../../themes/forumTheme";
import { FRIENDLY_HOVER_OVER_WIDTH } from "../../common/FriendlyHoverOver";

export const POST_PREVIEW_WIDTH = isFriendlyUI ? FRIENDLY_HOVER_OVER_WIDTH : 400;

export const POST_PREVIEW_ELEMENT_CONTEXT = "hoverPreview";
