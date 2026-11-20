import { $findMatchingParent } from '@lexical/utils';
import {
  $createNodeSelection,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  getDOMSelectionFromTarget,
  isHTMLElement,
} from 'lexical';

import { $isImageNode, type ImageNode, type ImagePayload } from '@/components/lexical/nodes/ImageNode';

export function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
}

export function $selectImageContainingCaret(): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return;
  }
  const image = $findMatchingParent(selection.anchor.getNode(), $isImageNode);
  if (!image) {
    return;
  }
  const nodeSelection = $createNodeSelection();
  nodeSelection.add(image.getKey());
  $setSelection(nodeSelection);
}

export function getDragImageData(event: DragEvent): null | ImagePayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== 'image') {
    return null;
  }

  return data;
}

export function $canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    isHTMLElement(target) &&
    !target.closest('code, figure.editor-image') &&
    isHTMLElement(target.parentElement) &&
    target.parentElement.closest('div.ContentEditable__root')
  );
}

export function getDragSelection(event: DragEvent): Range | null | undefined {
  let range;
  const domSelection = getDOMSelectionFromTarget(event.target);
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error('Cannot get the selection when dragging');
  }

  return range;
}

export function isImageFile(payload: Blob): boolean {
  return payload.type.startsWith('image/');
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}
