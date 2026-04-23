import { $generateNodesFromDOM } from "@lexical/html";
import {
  $isElementNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";

const NON_BREAKING_SPACE = "\u00A0";
const preserveWhitespaceTags = new Set([
  "PRE",
  "CODE",
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
]);
const preserveWhitespaceStyleRegex = /(?:^|;)\s*white-space\s*:\s*(?:pre|pre-wrap|break-spaces)\b/i;

function markConsecutiveSpacesInDom(node: Node, preserveWhitespace = false): void {
  if (node.nodeType === 1) {
    const element = node as Element;
    const preservesWhitespaceHere = preserveWhitespace
      || preserveWhitespaceTags.has(element.tagName)
      || preserveWhitespaceStyleRegex.test(element.getAttribute("style") ?? "");
    for (const child of Array.from(element.childNodes)) {
      markConsecutiveSpacesInDom(child, preservesWhitespaceHere);
    }
    return;
  }

  if (node.nodeType !== 3 || preserveWhitespace) {
    return;
  }

  const textContent = node.textContent;
  if (!textContent || !textContent.includes("  ")) {
    return;
  }

  node.textContent = textContent.replace(/ {2,}/g, (spaceRun) => {
    return ` ${NON_BREAKING_SPACE.repeat(spaceRun.length - 1)}`;
  });
}

function restoreRegularSpacesInLexicalNodes(nodes: LexicalNode[]): void {
  for (const node of nodes) {
    if ($isTextNode(node)) {
      const textContent = node.getTextContent();
      if (textContent.includes(NON_BREAKING_SPACE)) {
        node.setTextContent(textContent.replaceAll(NON_BREAKING_SPACE, " "));
      }
      continue;
    }

    if ($isElementNode(node)) {
      restoreRegularSpacesInLexicalNodes(node.getChildren());
    }
  }
}

export function generateNodesFromDOMPreservingWhitespace(
  editor: LexicalEditor,
  dom: Document | ParentNode,
): LexicalNode[] {
  const root = "body" in dom && dom.body ? dom.body : dom;
  for (const child of Array.from(root.childNodes)) {
    markConsecutiveSpacesInDom(child);
  }

  const nodes = $generateNodesFromDOM(editor, dom);
  restoreRegularSpacesInLexicalNodes(nodes);
  return nodes;
}
