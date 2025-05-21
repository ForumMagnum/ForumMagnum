import type { RefObject } from "react";
import type { JssStylesCallback } from "./jssStyles";

const TRUNCATION_PADDING = 10;

const getMaxExpandableWidth = (container: HTMLElement): number => {
  let width = container.getBoundingClientRect().width;
  // Get expandable width excluding first child
  for (let i = 1; i < container.children.length; ++i) {
    const child = container.children[i];
    width -= child.getBoundingClientRect().width;
  }
  return width;
}

type TruncationClasses = "more" | "scratch" | "placeholder" | "item";

/**
 * Here be dragons
 *
 * This function is called in a useEffect hook to format the items how we want.
 * This needs to be done _after_ the react render because we need to know the
 * size of each name in pixels which requires the DOM nodes to already be
 * mounted.
 *
 * The general idea is that react renders all the items into a separate "scratch"
 * div which has opacity: 0. This function then looks at how much space we have
 * to play with and the size of each item, and moves as many items as possible
 * from the "scratch" div into the actual visible div.
 *
 * When there's not enough space for all the items we add some text saying, for
 * example, '+ n more' where n is the number of excluded items.
 */
export const recalculateTruncation = (
  ref: RefObject<HTMLDivElement|null>,
  expandContainer: RefObject<HTMLDivElement|null>,
  classes: ClassesType<JssStylesCallback<TruncationClasses>>,
  reformatPlaceholder: (
    moreCount: number,
    totalItems: number,
    moreNode: Element,
  ) => void,
) => {
  if (!ref.current || !expandContainer.current) {
    return;
  }

  // Get the 'off-screen' scratch buffer (it's actually on-screen with opacity 0)
  const scratch = ref.current.querySelector("." + classes.scratch);
  if (!scratch) {
    return;
  }

  // Find the '+ n more' node and make sure it's at the end of the scratch node
  let more = scratch.querySelector("." + classes.more);
  if (!more) {
    more = ref.current.querySelector("." + classes.more);
    if (!more) {
      return;
    }
    scratch.appendChild(more);
  }

  // Remove the placeholder if it exists
  const placeholder = ref.current.querySelector("." + classes.placeholder);
  if (placeholder) {
    ref.current.removeChild(placeholder);
  }

  // Move all the items into the scratch node
  const displayedItems = ref.current.querySelectorAll("." + classes.item);
  for (const item of Array.from(displayedItems).reverse()) {
    scratch.insertBefore(item, scratch.firstChild);
  }

  // Find how much space we have and what needs to fit there
  const maxWidth = getMaxExpandableWidth(expandContainer.current);
  const items = Array.from(scratch.querySelectorAll("." + classes.item));
  const bounds = items.map((item) => item.getBoundingClientRect());

  // Calculate how may items we can fit
  let width = bounds[0].width;
  let moreCount = 0;
  let i = 1;
  for ( ; i < bounds.length; ++i) {
    const newWidth = width + bounds[i].width + TRUNCATION_PADDING;
    if (newWidth > maxWidth) {
      const moreWidth = more?.getBoundingClientRect().width;
      if (width + moreWidth > maxWidth) {
        i--;
      }
      moreCount = bounds.length - i;
      break;
    }
    width = newWidth;
  }

  // Move all the visible items to the right place and set n in '+ n more' if shown
  ref.current.innerHTML = "";
  for (let j = 0; j < i; ++j) {
    ref.current.appendChild(items[j]);
  }
  if (moreCount) {
    reformatPlaceholder(moreCount, items.length, more);
    ref.current.appendChild(more);
  }
  ref.current.appendChild(scratch);
}
