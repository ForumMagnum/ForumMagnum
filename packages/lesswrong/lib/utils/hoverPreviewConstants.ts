/**
 * Shared by the Lexical editor node that writes hover previews, the sanitizer
 * that validates them on save, the stylesheet that underlines them, and the
 * renderer that draws the card. Kept in lib/ so none of those has to import
 * the others (in particular, so the post renderer doesn't pull in Lexical).
 */

/** Holds the preview body as escaped HTML. */
export const HOVER_PREVIEW_ATTRIBUTE = 'data-hover-preview';

/** Styling hook for the dashed underline; see stylePiping. */
export const HOVER_PREVIEW_CLASS = 'hoverPreview';

/**
 * A preview body may itself contain previews. This bounds how deep the
 * sanitizer will recurse and how deep the renderer will draw; the two have to
 * agree, or previews get stored that never display.
 */
export const MAX_HOVER_PREVIEW_DEPTH = 3;
