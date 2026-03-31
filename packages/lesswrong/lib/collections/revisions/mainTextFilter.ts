import { parseDocumentFromString, ServerSafeNode } from "@/lib/domParser";
import { sanitizeAllowedTags } from "@/lib/utils/sanitize";
import { htmlToTextDefault } from "@/lib/htmlToText";
import { PLAINTEXT_HTML_TRUNCATION_LENGTH, PLAINTEXT_DESCRIPTION_LENGTH } from "./revisionConstants";
import { truncate } from "@/lib/editor/ellipsize";
import sanitizeHtml from "sanitize-html";

const PLAINTEXT_PREVIEW_BLOCKQUOTE_PLACEHOLDER = "[...]";
const PLAINTEXT_PREVIEW_HIDDEN_CLASSES = new Set(["spoilers", "spoiler", "spoiler-v2"]);

function isPlaintextPreviewHiddenClass(className: string | null | undefined): boolean {
  return className !== null && className !== undefined && PLAINTEXT_PREVIEW_HIDDEN_CLASSES.has(className);
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === ServerSafeNode.ELEMENT_NODE;
}

function isTextNode(node: Node): boolean {
  return node.nodeType === ServerSafeNode.TEXT_NODE;
}

function isBlockquoteElement(node: Node): node is Element {
  return isElementNode(node) && node.tagName.toLowerCase() === "blockquote";
}

function isWhitespaceTextNode(node: Node): boolean {
  return isTextNode(node) && !node.textContent?.trim();
}

function isPlaintextPreviewHiddenElement(element: Element): boolean {
  return element.tagName.toLowerCase() === "style" || isPlaintextPreviewHiddenClass(element.getAttribute("class"));
}

function collectConsecutiveBlockquoteNodes(nodes: Node[], startIndex: number): Node[] {
  const blockquoteNodes: Node[] = [];

  for (let index = startIndex; index < nodes.length; index++) {
    const node = nodes[index];
    if (isBlockquoteElement(node) || isWhitespaceTextNode(node)) {
      blockquoteNodes.push(node);
      continue;
    }
    break;
  }

  while (blockquoteNodes.length > 0 && isWhitespaceTextNode(blockquoteNodes[blockquoteNodes.length - 1])) {
    blockquoteNodes.pop();
  }

  return blockquoteNodes;
}

function removeNodes(nodes: Node[]): void {
  for (const node of nodes) {
    node.parentNode?.removeChild(node);
  }
}

function replaceBlockquoteRunWithPlaceholder(nodes: Node[]): void {
  const firstNode = nodes[0];
  if (!firstNode) {
    return;
  }

  const ownerDocument = firstNode.ownerDocument;
  if (!ownerDocument) {
    return;
  }

  const placeholder = ownerDocument.createElement("span");
  placeholder.textContent = ` ${PLAINTEXT_PREVIEW_BLOCKQUOTE_PLACEHOLDER} `;
  firstNode.parentNode?.insertBefore(placeholder, firstNode);
  removeNodes(nodes);
}

function rewritePlaintextPreviewNode(node: Node, hasVisibleContentBefore: boolean): boolean {
  if (isTextNode(node)) {
    return !!node.textContent?.trim();
  }

  if (!isElementNode(node) || isPlaintextPreviewHiddenElement(node)) {
    return false;
  }

  return rewriteBlockquotesForPlaintextPreview(node, hasVisibleContentBefore);
}

function rewriteBlockquotesForPlaintextPreview(parent: ParentNode, hasVisibleContentBefore: boolean): boolean {
  let hasVisibleContent = hasVisibleContentBefore;
  const childNodes = Array.from(parent.childNodes);

  for (let index = 0; index < childNodes.length; index++) {
    const childNode = childNodes[index];
    if (!childNode.parentNode) {
      continue;
    }

    if (isBlockquoteElement(childNode)) {
      const blockquoteNodes = collectConsecutiveBlockquoteNodes(childNodes, index);
      index += blockquoteNodes.length - 1;

      if (hasVisibleContent) {
        replaceBlockquoteRunWithPlaceholder(blockquoteNodes);
      } else {
        removeNodes(blockquoteNodes);
      }
      continue;
    }

    if (rewritePlaintextPreviewNode(childNode, hasVisibleContent)) {
      hasVisibleContent = true;
    }
  }

  return hasVisibleContent;
}

export function getPlaintextMainText(html: string): string {
  const { document } = parseDocumentFromString(html);
  rewriteBlockquotesForPlaintextPreview(document.body, false);

  const mainTextHtml = sanitizeHtml(document.body.innerHTML, {
    allowedTags: sanitizeAllowedTags.filter((tag) => tag !== "blockquote"),
    nonTextTags: ["blockquote", "style"],
    exclusiveFilter: (element) => {
      return isPlaintextPreviewHiddenClass(element.attribs?.class);
    },
  });
  const truncatedHtml = truncate(mainTextHtml, PLAINTEXT_HTML_TRUNCATION_LENGTH);
  return htmlToTextDefault(truncatedHtml, { fallbackToImageText: true }).substring(0, PLAINTEXT_DESCRIPTION_LENGTH);
}
