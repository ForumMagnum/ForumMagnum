const CODE_BLOCK_SELECTOR = 'pre.code-block, code.code-block';

/**
 * Lexical should never import a code block inside another code block. If old or
 * pasted HTML contains that shape, treat the inner block as literal code text.
 */
export function flattenNestedCodeBlocks(root: ParentNode): void {
  const codeBlocks = Array.from(root.querySelectorAll(CODE_BLOCK_SELECTOR));
  for (const codeBlock of codeBlocks) {
    const nestedCodeBlocks = Array.from(codeBlock.querySelectorAll(CODE_BLOCK_SELECTOR));
    for (const nestedCodeBlock of nestedCodeBlocks) {
      if (!nestedCodeBlock.parentNode) {
        continue;
      }
      const textNode = nestedCodeBlock.ownerDocument.createTextNode(nestedCodeBlock.textContent ?? '');
      nestedCodeBlock.replaceWith(textNode);
    }
  }
}
