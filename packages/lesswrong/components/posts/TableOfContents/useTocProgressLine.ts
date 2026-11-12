import { useEffect } from "react";

/**
 * Data attribute which FixedPositionToC places on each ToC row's dot, holding
 * the anchor (element id) of the heading in the post that the row corresponds
 * to. Used to pair up ToC rows with headings when computing the progress line.
 */
const TOC_ANCHOR_DATA_ATTRIBUTE = "data-toc-anchor";

/** Minimum height of the progress line, so it stays visible even when the viewport maps to a very short ToC range */
const MIN_LINE_HEIGHT = 10;

/**
 * A pair of corresponding positions: a y-coordinate in the post (in viewport
 * coordinates, as returned by getBoundingClientRect) and the y-coordinate in
 * the ToC (in pixels from the top of the progress bar) that it should line up
 * with.
 */
interface ProgressKeypoint {
  contentY: number,
  tocY: number,
}

interface UseTocProgressLineProps {
  /** The full-height progress bar container, on which the `--windowTop` and `--windowHeight` CSS variables are set */
  progressBarRef: React.RefObject<HTMLDivElement | null>,
  /** The element containing the ToC rows, whose dots are marked with `TOC_ANCHOR_DATA_ATTRIBUTE` */
  rowsRef: React.RefObject<HTMLDivElement | null>,
  /** If the post scrolls inside an element other than the window (eg a modal), that element */
  scrollContainerRef?: React.RefObject<HTMLElement | null>,
  disabled?: boolean,
}

function getContentElement(): HTMLElement | null {
  return document.getElementById('postContent') ?? document.getElementById('tagContent');
}

function isHiddenRect(rect: DOMRect): boolean {
  return rect.width === 0 && rect.height === 0;
}

function compareByContentY(a: ProgressKeypoint, b: ProgressKeypoint): number {
  return a.contentY - b.contentY;
}

/**
 * Sort keypoints by their position in the post, and drop any that would make
 * the mapping non-monotonic (eg a heading whose ToC row is above the row of an
 * earlier heading). The result is strictly increasing in both coordinates.
 */
function toMonotonicKeypoints(keypoints: ProgressKeypoint[]): ProgressKeypoint[] {
  const sorted = [...keypoints].sort(compareByContentY);
  const result: ProgressKeypoint[] = [];
  for (const keypoint of sorted) {
    const previous = result[result.length - 1];
    if (!previous || (keypoint.contentY > previous.contentY && keypoint.tocY > previous.tocY)) {
      result.push(keypoint);
    }
  }
  return result;
}

/**
 * Collect the correspondences between positions in the post and positions in
 * the ToC: the top of the scrollable document lines up with the top of the
 * progress bar, each heading lines up with the dot of its ToC row, and the
 * bottom of the post content lines up with the bottom of the progress bar.
 */
function getProgressKeypoints({barRect, rows, contentRect, documentTop}: {
  barRect: DOMRect,
  rows: HTMLElement,
  contentRect: DOMRect,
  documentTop: number,
}): ProgressKeypoint[] {
  const keypoints: ProgressKeypoint[] = [
    { contentY: documentTop, tocY: 0 },
    { contentY: contentRect.bottom, tocY: barRect.height },
  ];

  const dots = Array.from(rows.querySelectorAll<HTMLElement>(`[${TOC_ANCHOR_DATA_ATTRIBUTE}]`));
  for (const dot of dots) {
    const anchorId = dot.getAttribute(TOC_ANCHOR_DATA_ATTRIBUTE);
    const anchor = anchorId ? document.getElementById(anchorId) : null;
    if (!anchor) continue;

    // Skip headings which aren't currently laid out, eg because they're inside a collapsed section
    const anchorRect = anchor.getBoundingClientRect();
    if (isHiddenRect(anchorRect)) continue;

    const dotRect = dot.getBoundingClientRect();
    keypoints.push({
      contentY: anchorRect.top,
      tocY: dotRect.top + (dotRect.height / 2) - barRect.top,
    });
  }

  return toMonotonicKeypoints(keypoints);
}

/**
 * Map a y-coordinate in the post to a y-coordinate in the ToC by linear
 * interpolation between the surrounding keypoints. Positions outside the range
 * of the keypoints are clamped to the nearest end.
 */
function interpolateTocY(keypoints: ProgressKeypoint[], contentY: number): number {
  if (contentY <= keypoints[0].contentY) {
    return keypoints[0].tocY;
  }
  for (let i = 1; i < keypoints.length; i++) {
    const upper = keypoints[i];
    if (contentY <= upper.contentY) {
      const lower = keypoints[i - 1];
      const fraction = (contentY - lower.contentY) / (upper.contentY - lower.contentY);
      return lower.tocY + (fraction * (upper.tocY - lower.tocY));
    }
  }
  return keypoints[keypoints.length - 1].tocY;
}

function updateProgressLine(progressBar: HTMLElement, rows: HTMLElement, scrollContainer: HTMLElement | null) {
  const contentElement = getContentElement();
  if (!contentElement) return;

  const barRect = progressBar.getBoundingClientRect();
  const contentRect = contentElement.getBoundingClientRect();

  // The visible region, and the top of the scrollable document, in viewport coordinates
  const containerRect = scrollContainer?.getBoundingClientRect();
  const viewportTop = containerRect?.top ?? 0;
  const viewportBottom = containerRect?.bottom ?? window.innerHeight;
  const documentTop = (scrollContainer && containerRect)
    ? containerRect.top - scrollContainer.scrollTop
    : -window.scrollY;

  const keypoints = getProgressKeypoints({ barRect, rows, contentRect, documentTop });
  if (keypoints.length < 2) return;

  const lineTop = interpolateTocY(keypoints, viewportTop);
  const lineBottom = interpolateTocY(keypoints, viewportBottom);

  // Enforce a minimum height, keeping the line inside the bar
  const lineHeight = Math.max(MIN_LINE_HEIGHT, lineBottom - lineTop);
  const clampedLineTop = Math.max(0, Math.min(lineTop, barRect.height - lineHeight));

  progressBar.style.setProperty("--windowTop", `${clampedLineTop}px`);
  progressBar.style.setProperty("--windowHeight", `${lineHeight}px`);
}

/**
 * Positions the progress line in the full-height ToC so that it lines up with
 * the ToC rows: the line spans from the ToC position corresponding to the top
 * of the viewport to the one corresponding to the bottom of the viewport,
 * where positions in the post are mapped to positions in the ToC by
 * interpolating between the measured positions of headings in the post and
 * their rows in the ToC. Because ToC rows have a minimum height and don't
 * scale exactly with the sections they represent, this mapping (and hence the
 * position and length of the line) is nonlinear in scroll position.
 */
export function useTocProgressLine({progressBarRef, rowsRef, scrollContainerRef, disabled = false}: UseTocProgressLineProps) {
  useEffect(() => {
    if (disabled) return;
    const progressBar = progressBarRef.current;
    const rows = rowsRef.current;
    if (!progressBar || !rows) return;
    const scrollContainer = scrollContainerRef?.current ?? null;

    let pendingFrame: number | null = null;
    const update = () => {
      pendingFrame = null;
      updateProgressLine(progressBar, rows, scrollContainer);
    };
    const scheduleUpdate = () => {
      if (pendingFrame === null) {
        pendingFrame = window.requestAnimationFrame(update);
      }
    };

    update();
    const scrollTarget: HTMLElement | Window = scrollContainer ?? window;
    scrollTarget.addEventListener('scroll', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);

    // Post content can change size after load (eg images loading, sections
    // expanding), which moves the headings relative to the viewport
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    const contentElement = getContentElement();
    if (contentElement) {
      resizeObserver.observe(contentElement);
    }
    resizeObserver.observe(rows);

    return () => {
      scrollTarget.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      resizeObserver.disconnect();
      if (pendingFrame !== null) {
        window.cancelAnimationFrame(pendingFrame);
      }
    };
  }, [disabled, progressBarRef, rowsRef, scrollContainerRef]);

  // The ToC rows are re-laid-out when the sections change, so re-measure
  // after every render as well
  useEffect(() => {
    if (disabled) return;
    const progressBar = progressBarRef.current;
    const rows = rowsRef.current;
    if (!progressBar || !rows) return;
    updateProgressLine(progressBar, rows, scrollContainerRef?.current ?? null);
  });
}
