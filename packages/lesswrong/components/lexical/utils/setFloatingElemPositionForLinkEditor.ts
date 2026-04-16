/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const VERTICAL_GAP = 0;
const HORIZONTAL_OFFSET = 5;

export function setFloatingElemPositionForLinkEditor(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
  verticalGap: number = VERTICAL_GAP,
  horizontalOffset: number = HORIZONTAL_OFFSET,
): void {
  const scrollerElem = anchorElem.parentElement;

  if (targetRect === null || !scrollerElem) {
    floatingElem.style.opacity = '0';
    floatingElem.style.transform = 'translate(-10000px, -10000px)';
    return;
  }

  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const editorScrollerRect = scrollerElem.getBoundingClientRect();

  let top = targetRect.bottom + verticalGap;
  let left = targetRect.left - horizontalOffset;

  if (left + floatingElemRect.width > editorScrollerRect.right) {
    left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset;
  }

  // Flip the floating editor above the link when there isn't enough vertical
  // room below it inside the editor's scroller. Without this, editing a link
  // near the bottom of a comment causes the URL input row (which only appears
  // in edit mode, so it wasn't accounted for when the editor was first
  // positioned) to be hidden behind the comment form's cancel/submit row.
  // Only flip if there's actually enough space above; otherwise leave it
  // below and let whatever clipping happens be the least-bad option.
  if (top + floatingElemRect.height > editorScrollerRect.bottom) {
    const flippedTop = targetRect.top - floatingElemRect.height - verticalGap;
    if (flippedTop >= editorScrollerRect.top) {
      top = flippedTop;
    }
  }

  top -= anchorElementRect.top;
  left -= anchorElementRect.left;

  floatingElem.style.opacity = '1';
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}
