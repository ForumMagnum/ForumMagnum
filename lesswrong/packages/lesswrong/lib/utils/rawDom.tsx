import React, { useEffect, useLayoutEffect, useRef } from "react";
import { isClient } from "../executionEnvironment";


/**
 * Given a Range, which is a pair of text nodes plus offsets, mutate the DOM
 * so that there is a single span which encloses that range (and only that
 * range).
 *
 * This is _almost_ exactly the same as Range.surroundContents
 * (https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents)
 * except that it shouldn't fail if the range requires splitting a non-text
 * node.
 */
export function wrapRangeWithSpan(range: Range): HTMLSpanElement|null {
  // Insert an empty span, just before the start of the selection
  const span = document.createElement("span");
  range.insertNode(span);
  range.setStartAfter(span);
  
  // Use Range.extractContents to detach the selected nodes, and put them into
  // the span
  const extractedFragment = range.extractContents()
  span.append(extractedFragment);
  
  return span;
}

/**
 * For in-browser use only. Given a Node which has been detached from the DOM,
 * take ownership of it, and return a React component which will attach that
 * node as a child of itself. That React component may not appear in the
 * document more than once.
 */
export function rawDomNodeToReactComponent(node: Node) {
  if (node.parentElement) {
    throw new Error("Node was not detached");
  }
  
  function DomNodeComponent(props: {}) {
    const containerRef = useRef<HTMLSpanElement|null>(null);
    
    // Insert contents in `useLayoutEffect` so that the screen can't paint with
    // substituted content missing, and so that it precedes any `useEffect`s
    // (most notably the footnote-extraction useEffect in `FootnotePreview`).
    useLayoutEffect(() => {
      if (containerRef.current) {
        // If this has been attached somewhere else, detach it
        if (node.parentElement && node.parentElement !== containerRef.current) {
          node.parentElement.removeChild(node);
        }
        // If this node is detached, attach it to the container
        if (!node.parentElement) {
          containerRef.current.append(node);
        }
      }
    });
    
    return <span ref={containerRef}/>
  }
  
  return DomNodeComponent;
}

/**
 * For in-browser use only. Give an Element in the DOM (which might or might
 * not be detached), detach all its children, wrap them in a <span> if there's
 * more than one, and return a React component containing those children.
 */
export function rawExtractElementChildrenToReactComponent(element: Element) {
  const childNodes = element.childNodes;
  const numChildNodes = childNodes.length;

  if (numChildNodes===0) {
    return React.Fragment;
  } else if (numChildNodes===1) {
    const childNode = element.childNodes[0];
    element.removeChild(childNode);
    return rawDomNodeToReactComponent(childNode);
  } else {
    const span = document.createElement("span");
    const children: Node[] = [];
    for (let i=0; i<numChildNodes; i++) {
      children.push(childNodes[i]);
    }
    for (let node of children) {
      element.removeChild(node);
      span.appendChild(node);
    }
    return rawDomNodeToReactComponent(span);
  }
}

/**
 * Given a Range, split it into ranges which don't cross the boundaries of block
 * elements, each of which starts and ends inside a text node. We do this to
 * inline-react highlights before applying them, to prevent the highlight from
 * breaking list structure or paragraph structure.
 */
export function splitRangeIntoReplaceableSubRanges(range: Range): Range[] {
  // Reduce the range, so that the start and end are guaranteed to be in text
  // nodes
  const reducedRange = reduceRangeToText(range);
  if (!reducedRange) return [];
  
  // Iterate over text nodes. For each pair of consecutive text nodes, check
  // whether they have a non-common ancestor that is a block element. If so,
  // split there.
  let textNodesInRange: Text[] = [];
  for (
    let pos: Text|null = reducedRange.startContainer as Text;
    pos && pos!==reducedRange.endContainer;
    pos=nextTextNodeAfter(pos)
  ) {
    textNodesInRange.push(pos);
  }
  textNodesInRange.push(reducedRange.endContainer as Text);
  
  let subranges: Range[] = [range];
  for (let i=1; i<textNodesInRange.length; i++) {
    if (!nodesCanShareSpan(textNodesInRange[i-1], textNodesInRange[i])) {
      let precedingSubrange = subranges.pop()!;
      let beforeSplit = precedingSubrange.cloneRange();
      let afterSplit = precedingSubrange.cloneRange();
      beforeSplit.setEnd(textNodesInRange[i-1], textNodesInRange[i-1].length);
      afterSplit.setStart(textNodesInRange[i], 0);
      subranges.push(beforeSplit);
      subranges.push(afterSplit);
    }
  }
  
  return subranges;
}

/**
 * Given two nodes, return whether, if extracted for a hover-highlight, they
 * can be placed in the same span, ie, this does not straddle a block boundary.
 */
function nodesCanShareSpan(first: Node, second: Node): boolean {
  const closestCommonAncestor = getClosestCommonAncestor(first, second);
  if (!closestCommonAncestor) return false;
  
  for (let pos: Node|null=first; pos && pos!==closestCommonAncestor; pos=pos.parentElement) {
    if (isBlockElement(pos))
      return false;
  }
  for (let pos: Node|null=second; pos && pos!==closestCommonAncestor; pos=pos.parentElement) {
    if (isBlockElement(pos))
      return false;
  }
  
  return true;
}

function getClosestCommonAncestor(node1: Node, node2: Node): Node|null {
  let pos: Node|null = node1;

  while (pos) {
    if (node2.contains(pos)) {
      return pos;
    }
    pos = pos.parentNode;
  }
  return null;
}

/**
 * Returns whether the given node is a block element (ie, an element which can't
 * be extracted from the DOM and futzed with by inline react hover hihlighting).
 */
function isBlockElement(node: Node) {
  if (node.nodeType !== Node.ELEMENT_NODE)
    return false;
  switch ((node as Element).tagName) {
    // This list of tag names was generated by looking at the allowed tag names
    // in the sanitizer config so it should be reasonably complete
    case "p": case "div": case 'blockquote':
    case "li": case "ol": case "ul": case "nl":
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
    case "table": case "tbody": case "tr": case "td": case "th":
    case "section":case "iframe":
      return true;
    default:
      return false;
  }
}

/**
 * Given a Range (a browser DOM API), reduce it to the smallest range that
 * contains the same text. So for example this range:
 *    <p>Paragraph One</p><p>Paragraph Two</p>
 *                 ^-----^
 * would become this range:
 *    <p>Paragraph One</p><p>Paragraph Two</p>
 *                 ^-^
 * The resulting range is guaranteed to have its start and end both be inside
 * text nodes. If the resulting range would have zero size (ie, it doesn't)
 * enclose any text), returns null.
 */
export function reduceRangeToText(range: Range): Range|null {
  if (!isClient) {
    throw new Error("This function can only run in the browser");
  }
  
  let result = range.cloneRange();
  
  // Adjust the start position forwards
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;
  if (startContainer.nodeType === Node.TEXT_NODE) {
    // Start position is inside a text node
    // startOffset is the number of characters from the start of this text node
    // to the range boundary.
    const textNodeLength = startContainer.textContent?.length ?? 0
    if (textNodeLength === startOffset) {
      // Inside a text node, buf after all of the actual text. Find the next
      // text node in the tree, and set the position to be the start of that
      // one rather than the end of this one.
      const nextTextNode = nextNonemptyTextNodeAfter(startContainer as Text);
      if (!nextTextNode) return null;
      result.setStart(nextTextNode, 0);
    }
  } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
    // Start position is inside an element node
    // Per https://developer.mozilla.org/en-US/docs/Web/API/Range/startOffset,
    // startOffset is measured in _child nodes_, not characters.
    // Start by going down the tree until we're at a leaf node. Then if that
    // node is not a text node, walk forward until we reach a text node, in
    // which the new start position is offset 0.
    let pos = startContainer.childNodes[startOffset];
    while (pos.hasChildNodes()) {
      pos = pos.childNodes[0];
    }
    if (pos.nodeType === Node.TEXT_NODE) {
      result.setStart(pos, 0);
    } else {
      const nextTextNode = nextNonemptyTextNodeAfter(pos);
      if (!nextTextNode) return null;
      result.setStart(nextTextNode, 0);
    }
  }
  
  // Now adjust the end position backwards. This is very similar to how we do
  // the start position, except everything goes in the opposite direction.
  const endContainer = range.endContainer;
  const endOffset = range.endOffset;
  if (endContainer.nodeType === Node.TEXT_NODE) {
    // End position is inside a text node
    if (endOffset === 0) {
      // Inside a text node, but before all of the actual text. Find the
      // previous text node in the tree, and set the position to be the end of
      // that one rather than the start of this one.
      const prevTextNode = prevTextNodeBefore(endContainer as Text);
      if (!prevTextNode) return null;
      result.setEnd(prevTextNode, prevTextNode.textContent?.length ?? 0);
    }
  } else {
    // End position is inside a non-text node
    let pos = endContainer.childNodes[endOffset];
    while (pos.hasChildNodes()) {
      pos = pos.childNodes[pos.childNodes.length-1];
    }
    if (pos.nodeType === Node.TEXT_NODE) {
      result.setEnd(pos, pos.textContent?.length ?? 0);
    } else {
      const prevTextNode = prevTextNodeBefore(pos);
      if (!prevTextNode) return null;
      result.setEnd(prevTextNode, prevTextNode.textContent?.length ?? 0);
    }
  }
  
  return result;
}

function nextTextNodeAfter(node: Node): Text|null {
  let pos: Node|null = node;
  do {
    pos = nextLeafNodeAfter(pos);
  } while (pos && pos.nodeType !== Node.TEXT_NODE);
  return pos as Text|null;
}

function nextNonemptyTextNodeAfter(node: Node): Text|null {
  let pos: Node|null = node;
  do {
    pos = nextLeafNodeAfter(pos);
  } while (pos && (pos.nodeType !== Node.TEXT_NODE || pos.textContent===null || !pos.textContent.length));
  return pos as Text|null;
}

function prevTextNodeBefore(node: Node): Text|null {
  let pos: Node|null = node;
  do {
    pos = prevLeafNodeBefore(pos);
  } while (pos && pos.nodeType !== Node.TEXT_NODE);
  return pos as Text|null;
}

function nextLeafNodeAfter(node: Node): Node|null {
  if (node.nextSibling) {
    return firstDescendentOf(node.nextSibling);
  } else {
    let pos = node;
    while(pos.parentElement) {
      const nextSibling = nextSiblingNodeAfter(pos.parentElement, pos);
      if (nextSibling) {
        return firstDescendentOf(nextSibling);
      }
      pos = pos.parentElement;
    }
  }
  return null;
}

function prevLeafNodeBefore(node: Node): Node|null {
  if (node.previousSibling) {
    return lastDescendentOf(node.previousSibling);
  } else {
    let pos = node;
    while(pos.parentElement) {
      const prevSibling = prevSiblingNodeBefore(pos.parentElement, pos);
      if (prevSibling) {
        return lastDescendentOf(prevSibling);
      }
      pos = pos.parentElement;
    }
  }
  return null;
}

function firstDescendentOf(node: Node): Node {
  let pos = node;
  while(pos.hasChildNodes()) {
    pos = pos.childNodes[0];
  }
  return pos;
}

function lastDescendentOf(node: Node): Node {
  let pos = node;
  while(pos.hasChildNodes()) {
    pos = pos.childNodes[pos.childNodes.length-1];
  }
  return pos;
}

function nextSiblingNodeAfter(parentElement: Element, childNode: Node): Node|null {
  let idx = getNodeIndex(parentElement, childNode);
  if (idx === null) {
    return null;
  }
  if (idx+1 < parentElement.childNodes.length) {
    return parentElement.childNodes[idx+1];
  } else {
    return null;
  }
}

function prevSiblingNodeBefore(parentElement: Element, childNode: Node): Node|null {
  let idx = getNodeIndex(parentElement, childNode);
  if (idx === null) {
    return null;
  }
  if (idx > 0) {
    return parentElement.childNodes[idx-1];
  } else {
    return null;
  }
}

function getNodeIndex(parentElement: Element, node: Node): number|null {
  const numChildren = parentElement.childNodes.length;
  for (let i=0; i<numChildren; i++) {
    if (parentElement.childNodes[i] === node)
      return i;
  }
  return null;
}
