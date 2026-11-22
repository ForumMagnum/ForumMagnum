import { useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import { FILLS_SPACE_SELECTOR, SECTION_BODY_SELECTOR, SECTION_SELECTOR, SHARES_SPACE_SELECTOR, SPACE_ATTRIBUTES } from './ModerationSidebarSection';

function getVerticalMargins(element: Element): number {
  const style = getComputedStyle(element);
  return parseFloat(style.marginTop) + parseFloat(style.marginBottom);
}

/** Height the section would need to show all of its content without scrolling */
function getNaturalSectionHeight(section: HTMLElement): number {
  const style = getComputedStyle(section);
  const chrome = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
    + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  // The body is clipped to the section, so measure its contents rather than the body itself
  const contentElements = Array.from(section.children).flatMap(child =>
    child.matches(SECTION_BODY_SELECTOR) ? Array.from(child.children) : [child]
  );
  return chrome + sumBy(contentElements, element => element.getBoundingClientRect().height + getVerticalMargins(element));
}

/**
 * The largest height cap such that capping every section at it fits them all
 * into availableHeight. Infinity if they all fit uncapped.
 */
function getHeightCap(naturalHeights: number[], availableHeight: number): number {
  const ascendingNaturalHeights = sortBy(naturalHeights);
  let remainingHeight = availableHeight;
  for (const [index, naturalHeight] of ascendingNaturalHeights.entries()) {
    const equalShare = remainingHeight / (ascendingNaturalHeights.length - index);
    if (naturalHeight > equalShare) {
      return Math.max(0, Math.floor(equalShare));
    }
    remainingHeight -= naturalHeight;
  }
  return Infinity;
}

function balanceSectionHeights(root: HTMLElement) {
  const allSections = Array.from(root.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
  const someSectionFillsSpace = !!root.querySelector(FILLS_SPACE_SELECTOR);
  const balancedSections = someSectionFillsSpace ? [] : allSections.filter(section => section.matches(SHARES_SPACE_SELECTOR));
  const unbalancedSections = allSections.filter(section => !balancedSections.includes(section));

  for (const section of unbalancedSections) {
    section.style.minHeight = '';
  }
  if (!balancedSections.length) {
    return;
  }

  const availableHeight = root.clientHeight - sumBy(unbalancedSections, section => section.getBoundingClientRect().height);
  const naturalHeights = balancedSections.map(getNaturalSectionHeight);
  const heightCap = getHeightCap(naturalHeights, availableHeight);
  for (const [index, section] of balancedSections.entries()) {
    section.style.minHeight = `${Math.min(naturalHeights[index], heightCap)}px`;
  }
}

/**
 * Space-sharing sections split the sidebar's free height evenly via flex, which
 * on its own makes a long section scroll while a short neighbor sits half empty.
 * A min-height of each section's content height (capped so they all still fit)
 * makes flex give a long section the room it needs and split the rest evenly
 * among the others.
 */
export function useBalancedSidebarSectionHeights(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    let animationFrame: number | null = null;
    const scheduleBalance = () => {
      if (animationFrame !== null) {
        return;
      }
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        balanceSectionHeights(root);
      });
    };

    const observedElements = new WeakSet<Element>();
    const resizeObserver = new ResizeObserver(scheduleBalance);
    const observeSectionChildren = () => {
      const sectionChildren = Array.from(root.querySelectorAll(`${SECTION_SELECTOR} > *, ${SECTION_BODY_SELECTOR} > *`));
      for (const child of sectionChildren) {
        if (!observedElements.has(child)) {
          observedElements.add(child);
          resizeObserver.observe(child);
        }
      }
    };

    resizeObserver.observe(root);
    observeSectionChildren();
    const mutationObserver = new MutationObserver(() => {
      observeSectionChildren();
      scheduleBalance();
    });
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: SPACE_ATTRIBUTES,
    });
    scheduleBalance();

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [rootRef]);
}
