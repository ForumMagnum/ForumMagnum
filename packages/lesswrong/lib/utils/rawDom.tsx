import React, { useEffect, useRef } from "react";

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
    
    useEffect(() => {
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
