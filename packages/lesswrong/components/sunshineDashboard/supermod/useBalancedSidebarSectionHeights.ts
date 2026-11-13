import { useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';

const FILLS_SPACE_SELECTOR = '[data-moderation-sidebar-fills-space="true"]';
const HIGHLIGHTS_SELECTOR = '[data-moderation-sidebar-highlights="true"]';
const SECTION_SELECTOR = '[data-moderation-sidebar-section="true"]';

function getVerticalMargins(element: Element): number {
  const style = getComputedStyle(element);
  return parseFloat(style.marginTop) + parseFloat(style.marginBottom);
}

/** Height the section would need to show all of its content without scrolling */
function getNaturalSectionHeight(section: HTMLElement): number {
  const style = getComputedStyle(section);
  const chrome = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
    + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  const sectionChildren = Array.from(section.children);
  return chrome + sumBy(sectionChildren, child => child.getBoundingClientRect().height + getVerticalMargins(child));
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
  const balancedSections = someSectionFillsSpace ? [] : allSections.filter(section => section.matches(HIGHLIGHTS_SELECTOR));
  const unbalancedSections = allSections.filter(section => !balancedSections.includes(section));

  for (const section of unbalancedSections) {
    section.style.minHeight = '';
    section.style.flexBasis = '';
  }
  if (!balancedSections.length) {
    return;
  }

  const availableHeight = root.clientHeight - sumBy(unbalancedSections, section => section.getBoundingClientRect().height);
  const naturalHeights = balancedSections.map(getNaturalSectionHeight);
  const heightCap = getHeightCap(naturalHeights, availableHeight);
  for (const [index, section] of balancedSections.entries()) {
    section.style.minHeight = `${Math.min(naturalHeights[index], heightCap)}px`;
    section.style.flexBasis = `${naturalHeights[index]}px`;
  }
}

/**
 * Highlighted sections split the sidebar's free height evenly via flex, which
 * makes a long section scroll while a short neighbor sits half empty. Basing
 * each one on its content height means leftover space becomes equal padding
 * for every section, and a min-height of its content height (capped so they
 * all still fit) lets a long section take the slack when space is tight,
 * while short sections keep enough room not to scroll themselves.
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
      const sectionChildren = Array.from(root.querySelectorAll(`${SECTION_SELECTOR} > *`));
      for (const child of sectionChildren) {
        if (!observedElements.has(child)) {
          observedElements.add(child);
          resizeObserver.observe(child);
        }
      }
    };

    observedElements.add(root);
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
      attributeFilter: ['data-moderation-sidebar-fills-space', 'data-moderation-sidebar-highlights'],
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
