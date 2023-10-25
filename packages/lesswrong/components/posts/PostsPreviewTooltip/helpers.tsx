import { isEAForum } from "../../../lib/instanceSettings";
import { EA_HOVER_OVER_WIDTH } from "../../ea-forum/EAHoverOver";

export const POST_PREVIEW_WIDTH = isEAForum ? EA_HOVER_OVER_WIDTH : 400;

export const POST_PREVIEW_ELEMENT_CONTEXT = "hoverPreview";
