/**
 * Where the narration player goes on the screen, and how it tells the rest of
 * the page what it's covering, so that other things that are fixed to the
 * bottom of the screen can keep clear of it.
 *
 * The player is laid out in one of two ways: floating in the bottom-right
 * corner (on screens wide enough that post pages have a margin there), or as
 * a bar docked across the bottom of the screen. While it's open it sets a
 * class on the body that says which, and a custom property with its height.
 */

/** The player floats from this width up, and is docked below it */
export const NARRATION_PLAYER_FLOATING_BREAKPOINT: BreakpointName = "lg";

/**
 * A media query for the widths at which the docked player is wider than a
 * phone's screen. Only there does it have room to put everything in one row;
 * a phone, and the floating player, are both narrow.
 */
export function narrationPlayerHasRoom(theme: ThemeType): string {
  const widerThanPhone = theme.breakpoints.up("sm");
  const docked = theme.breakpoints.down("md").replace("@media ", "");
  return `${widerThanPhone} and ${docked}`;
}

/** On the body while the narration player is docked across the bottom of the screen */
export const NARRATION_PLAYER_DOCKED_CLASS = "narration-player-docked";
/** On the body while the narration player is floating in the bottom-right corner of the screen */
export const NARRATION_PLAYER_FLOATING_CLASS = "narration-player-floating";

const DOCK_HEIGHT_PROPERTY = "--narration-dock-height";
const CORNER_HEIGHT_PROPERTY = "--narration-corner-height";
/** The space left between the floating player and something that's moved up to be above it */
const CORNER_CLEARANCE = 12;

/** A CSS length: the height of the narration player if it's docked across the bottom of the screen, and otherwise zero */
export const narrationDockHeight = `var(${DOCK_HEIGHT_PROPERTY}, 0px)`;

/**
 * A CSS length for the `bottom` of something that's fixed in the bottom-right
 * corner of the screen: where it normally is, or if the narration player is
 * floating in that corner, just above the player.
 */
export function bottomClearOfNarrationPlayer(normalBottom: number): string {
  return `max(${normalBottom}px, calc(var(${CORNER_HEIGHT_PROPERTY}, 0px) + ${CORNER_CLEARANCE}px))`;
}

/** `topEdge` is how far the top of the player is from the bottom of the screen */
export function publishNarrationPlayerFootprint({ isFloating, topEdge }: { isFloating: boolean, topEdge: number }) {
  const { body, documentElement } = document;
  body.classList.toggle(NARRATION_PLAYER_DOCKED_CLASS, !isFloating);
  body.classList.toggle(NARRATION_PLAYER_FLOATING_CLASS, isFloating);
  documentElement.style.setProperty(isFloating ? CORNER_HEIGHT_PROPERTY : DOCK_HEIGHT_PROPERTY, `${topEdge}px`);
  documentElement.style.removeProperty(isFloating ? DOCK_HEIGHT_PROPERTY : CORNER_HEIGHT_PROPERTY);
}

export function clearNarrationPlayerFootprint() {
  document.body.classList.remove(NARRATION_PLAYER_DOCKED_CLASS, NARRATION_PLAYER_FLOATING_CLASS);
  document.documentElement.style.removeProperty(DOCK_HEIGHT_PROPERTY);
  document.documentElement.style.removeProperty(CORNER_HEIGHT_PROPERTY);
}
