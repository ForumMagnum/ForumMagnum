export const UNDO_QUEUE_DURATION = 15_000;

/**
 * Width of the keystroke-chip / checkbox column in the moderation sidebar, so every
 * command row's label starts at the same x. Sized to fit the widest keystroke in the
 * collapsed stack of rows that actually need to line up — a modifier plus one letter
 * (⇧M, ⌘R), ~28px at fontSize 10. A longer keystroke grows past the gutter and takes
 * its own label with it; the only one that does is the ⌘Enter on the expanded
 * composers' submit buttons, which stand alone rather than in the aligned stack.
 */
export const KEYSTROKE_GUTTER = 32;
