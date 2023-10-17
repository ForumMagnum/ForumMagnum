import { isEAForum } from "../../../lib/instanceSettings";

export const POST_PREVIEW_WIDTH = isEAForum ? 340 : 400;

export const POST_PREVIEW_ELEMENT_CONTEXT = "hoverPreview";
