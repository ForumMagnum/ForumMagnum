import { $getSelection, $isNodeSelection, getDOMSelectionFromTarget, isHTMLElement } from 'lexical';

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

interface FileWithContents {
  file: File;
  contents: Uint8Array | null;
}

function readFileContentsWithFileReader(file: File): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result;
        resolve(result instanceof ArrayBuffer ? new Uint8Array(result) : null);
      });
      reader.addEventListener('error', () => resolve(null));
      reader.addEventListener('abort', () => resolve(null));
      reader.readAsArrayBuffer(file);
    } catch {
      resolve(null);
    }
  });
}

async function readFileContents(file: File): Promise<Uint8Array | null> {
  if (typeof file.arrayBuffer === 'function') {
    try {
      return new Uint8Array(await file.arrayBuffer());
    } catch {
      // Fall back to FileReader for browser-provided File implementations.
    }
  }
  return readFileContentsWithFileReader(file);
}

async function readFileWithContents(file: File): Promise<FileWithContents> {
  return {
    file,
    contents: await readFileContents(file),
  };
}

function contentsAreEqual(first: Uint8Array, second: Uint8Array): boolean {
  if (first.byteLength !== second.byteLength) {
    return false;
  }
  for (let index = 0; index < first.byteLength; index += 1) {
    if (first[index] !== second[index]) {
      return false;
    }
  }
  return true;
}

function filesHaveSameContents(first: FileWithContents, second: FileWithContents): boolean {
  if (first.contents === null || second.contents === null) {
    return false;
  }
  return contentsAreEqual(first.contents, second.contents);
}

/**
 * Some clipboard providers expose the same image multiple times in
 * DataTransfer.files. Uploading every entry makes one paste insert several
 * copies, so collapse byte-identical files while preserving distinct images
 * and their clipboard order.
 */
export async function getUniqueImageFiles(files: readonly File[]): Promise<File[]> {
  const imageFiles = files.filter(isImageFile);
  const filesWithContents = await Promise.all(imageFiles.map(readFileWithContents));
  const uniqueFilesWithContents: FileWithContents[] = [];

  for (const candidate of filesWithContents) {
    const duplicate = uniqueFilesWithContents.some(existing =>
      filesHaveSameContents(existing, candidate)
    );
    if (duplicate) {
      continue;
    }

    uniqueFilesWithContents.push(candidate);
  }

  return uniqueFilesWithContents.map(({ file }) => file);
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}
