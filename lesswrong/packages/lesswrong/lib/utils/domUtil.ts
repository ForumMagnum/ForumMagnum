
/**
 * Get the y-position of a DOM element by following the chain of `offsetParent`
 * links and adding up `offsetTop`.
 */
export function getOffsetChainTop(element: HTMLElement) {
  let y=0;
  let pos: AnyBecauseHard = element;
  while (pos) {
    if (pos.offsetTop) {
      y += pos.offsetTop;
    }
    pos = pos.offsetParent;
  }
  return y;
}
