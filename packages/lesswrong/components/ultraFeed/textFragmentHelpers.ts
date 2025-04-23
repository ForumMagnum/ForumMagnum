/**
 * Text Fragment Generation Helpers
 * ---------------------------------
 * This file contains the logic for generating Text Fragment URL hashes (`#:~:text=...`).
 * These hashes are used to link directly to a specific text passage within HTML content,
 * typically starting just after where the content was truncated in a preview.
 *
 * Main Exported Function:
 * - `generateTextFragment(truncatedHtml, fullHtml)`: This is the primary function.
 *   It orchestrates the process of finding the truncation point and searching for
 *   a suitable text passage in the `fullHtml` to create the fragment hash.
 *
 * Internal Logic Flow (`generateTextFragment`):
 * 1. Determines the word count (`actualTruncationWordIndex`) of the visible `truncatedHtml`.
 * 2. Finds the approximate DOM node (`startSearchNode`) in the `fullHtml` corresponding
 *    to this word index using `findNodeAtWordIndex`.
 * 3. **Attempt 1 (Truncation Paragraph Remainder):**
 *    - Finds the parent `<p>` tag (`truncationParagraph`) of `startSearchNode`.
 *    - If found, uses `extractWordsFromWalker` to get words *after* `startSearchNode`
 *      within `truncationParagraph`.
 *    - If enough words remain (`>= MIN_CONTINUATION_WORDS`), it generates the fragment
 *      using these remaining words based on `FRAGMENT_*` constants.
 * 4. **Attempt 2 (Subsequent Paragraphs Fallback):**
 *    - If Attempt 1 fails, it searches for the next `<p>` tags occurring *after*
 *      the `truncationParagraph` (or `startSearchNode`).
 *    - It checks up to `MAX_SUBSEQUENT_PARAGRAPHS_TO_CHECK` paragraphs.
 *    - For the first suitable paragraph found (with enough words), it uses
 *      `extractWordsWithSpaces` to get all words from that paragraph and generates
 *      the fragment using words from the *beginning* of that paragraph.
 * 5. Returns the generated hash string or `undefined` if no suitable passage is found.
 *
 * Internal Helper Functions:
 * - `extractWordsWithSpaces(node)`: Traverses the DOM from `node`, intelligently
 *   extracting text content into an array of words, attempting to handle spaces
 *   introduced by block elements.
 * - `findNodeAtWordIndex(rootNode, targetWordIndex)`: Walks text nodes within `rootNode`
 *   to find the specific text node containing the word at `targetWordIndex`.
 * - `extractWordsFromWalker(rootNode, startAfterNode)`: Extracts words from text nodes
 *   within `rootNode`, but only *after* encountering `startAfterNode` during traversal.
 *
 * Environment Note:
 * - These functions rely heavily on browser DOM APIs (`window`, `document`, `DOMParser`,
 *   `TreeWalker`, `getComputedStyle`). They are not suitable for server-side execution
 *   without polyfills or adaptation.
 */

// Constants for Text Fragment Generation (Internal)
const FRAGMENT_START_PHRASE_WORDS = 3; // Start phrase
const FRAGMENT_END_PHRASE_WORDS = 1;   // End phrase
const FRAGMENT_CONTINUATION_SEPARATION = 10; // Words between start and end
const MIN_CONTINUATION_WORDS = FRAGMENT_START_PHRASE_WORDS + FRAGMENT_CONTINUATION_SEPARATION + FRAGMENT_END_PHRASE_WORDS; // Update minimum
const MAX_SUBSEQUENT_PARAGRAPHS_TO_CHECK = 3;

// Helper: Basic word extraction (Internal)
// NOTE: This depends on the global `window` object and DOM APIs. Ensure this file is only used in a browser environment.
const extractWordsWithSpaces = (node: Node): string[] => {
    // Ensure running in browser context
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return [];
    }
    let words: string[] = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    let lastNodeType: number | null = null;

    while (walker.nextNode()) {
        const currentNode = walker.currentNode;
        if (currentNode.nodeType === Node.TEXT_NODE) {
            const parentElement = currentNode.parentElement;
            if (!currentNode.textContent?.trim() ||
                (parentElement && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parentElement.tagName))) {
                continue;
            }
            if (lastNodeType === Node.ELEMENT_NODE && words.length > 0 && !words[words.length - 1].endsWith(' ')) {
                 words.push(' ');
            }
            const nodeWords = currentNode.textContent.split(/\s+/).filter(w => w.length > 0);
            words = words.concat(nodeWords);
            lastNodeType = Node.TEXT_NODE;
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
            const element = currentNode as Element;
            // Check computed style only if in browser
             const displayStyle = window.getComputedStyle(element).display;
             const isBlock = ['block', 'list-item', 'table', 'flex', 'grid'].includes(displayStyle);
             if (lastNodeType === Node.TEXT_NODE && isBlock && words.length > 0 && !words[words.length - 1].endsWith(' ')) {
                  words.push(' ');
             }
            lastNodeType = Node.ELEMENT_NODE;
        }
    }
    return words.join(' ').replace(/\s+/g, ' ').trim().split(' ');
};


// Helper: Find node near word index (Internal)
const findNodeAtWordIndex = (rootNode: Node, targetWordIndex: number): { node: Node | null } => {
    // Ensure running in browser context
    if (typeof document === 'undefined') {
        return { node: null };
    }
    let cumulativeWordCount = 0;
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null);
    let currentNode: Node | null = null;

    while ((currentNode = walker.nextNode()) !== null) {
        const textContent = currentNode.textContent || '';
        const wordsInNode = textContent.match(/\S+/g) || [];
        const wordCountInNode = wordsInNode.length;
        if (cumulativeWordCount + wordCountInNode > targetWordIndex) {
            return { node: currentNode };
        }
        cumulativeWordCount += wordCountInNode;
    }
    if (cumulativeWordCount === targetWordIndex && targetWordIndex > 0) {
        const resetWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null);
        let lastNode: Node | null = null;
        let currentResetNode: Node | null = null;
        while((currentResetNode = resetWalker.nextNode()) !== null) {
             lastNode = currentResetNode;
        }
        return { node: lastNode };
    }
    return { node: null };
};

// Helper: Extract words after a node within a root (Internal)
const extractWordsFromWalker = (rootNode: Node, startAfterNode?: Node | null): string[] => {
    // Ensure running in browser context
    if (typeof document === 'undefined') {
        return [];
    }
    let words: string[] = [];
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null);
    if (startAfterNode) {
        walker.currentNode = startAfterNode;
    }
    let currentNode: Node | null;
    while ((currentNode = walker.nextNode()) !== null) {
         const textContent = currentNode.textContent || '';
         const nodeWords = textContent.match(/\S+/g) || [];
         words = words.concat(nodeWords);
    }
    return words;
};


/**
 * Generates a Text Fragment URL hash (#:~:text=...) to link to a specific
 * text passage that starts after a truncation point in HTML content.
 *
 * It prioritizes finding the text within the paragraph where truncation occurred,
 * falling back to searching up to 3 subsequent paragraphs if the first is unsuitable.
 * Assumes it's running in a browser environment with DOM APIs.
 *
 * @param truncatedHtml The HTML string *before* truncation (used to find the split point).
 * @param fullHtml The complete HTML string to search within.
 * @returns The generated text fragment hash (e.g., "#:~:text=start,end") or undefined if failed.
 */
export const generateTextFragment = (truncatedHtml: string, fullHtml: string): string | undefined => {
    // Check for server-side rendering or non-browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof DOMParser === 'undefined') {
         return undefined;
    }
    const parser = new DOMParser();

    // 1. Truncation index
    const truncatedDoc = parser.parseFromString(truncatedHtml, 'text/html');
    const truncatedWords = extractWordsWithSpaces(truncatedDoc.body);
    const actualTruncationWordIndex = truncatedWords.length;

    // 2. Parse full HTML & basic check
    const fullDoc = parser.parseFromString(fullHtml, 'text/html');
    const fullWords = extractWordsWithSpaces(fullDoc.body);
    if (actualTruncationWordIndex >= fullWords.length) {
        return undefined;
    }

    // 3. Find node near truncation
    const { node: startSearchNode } = findNodeAtWordIndex(fullDoc.body, actualTruncationWordIndex);
    if (!startSearchNode) {
         return undefined;
    }

    let textFragmentHash: string | undefined = undefined;

    // 4. Attempt 1: Check remainder of the paragraph containing the truncation
    const truncationParagraph = (startSearchNode.parentElement?.closest('p') as HTMLParagraphElement | null);
    let searchStartNodeForFallback: Node = startSearchNode;

    if (truncationParagraph) {
        searchStartNodeForFallback = truncationParagraph;
        const remainingWords = extractWordsFromWalker(truncationParagraph, startSearchNode);
        const remainingWordCount = remainingWords.length;

        if (remainingWordCount >= MIN_CONTINUATION_WORDS) {
            const startPhraseEndIndex = FRAGMENT_START_PHRASE_WORDS;
            const endPhraseStartIndex = startPhraseEndIndex + FRAGMENT_CONTINUATION_SEPARATION;
            const endPhraseEndIndex = endPhraseStartIndex + FRAGMENT_END_PHRASE_WORDS;

            if (endPhraseEndIndex <= remainingWordCount) {
                const textStart = remainingWords.slice(0, startPhraseEndIndex).join(' ');
                const textEnd = remainingWords.slice(endPhraseStartIndex, endPhraseEndIndex).join(' ');
                textFragmentHash = `#:~:text=${encodeURIComponent(textStart)},${encodeURIComponent(textEnd)}`;
                return textFragmentHash;
            }
        }
    }

    // 5. Attempt 2 (Fallback): Search subsequent paragraphs
    let paragraphsChecked = 0;
    const walker = document.createTreeWalker(fullDoc.body, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => (node as Element).tagName === 'P' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    walker.currentNode = searchStartNodeForFallback;

    let currentParagraphElement: HTMLParagraphElement | null;
    while ((currentParagraphElement = walker.nextNode() as HTMLParagraphElement | null) !== null && paragraphsChecked < MAX_SUBSEQUENT_PARAGRAPHS_TO_CHECK) {
        if (truncationParagraph && currentParagraphElement === truncationParagraph) continue;

        paragraphsChecked++;
        const paragraphWords = extractWordsWithSpaces(currentParagraphElement);
        const paragraphWordCount = paragraphWords.length;

        if (paragraphWordCount >= MIN_CONTINUATION_WORDS) {
            const startPhraseEndIndex = FRAGMENT_START_PHRASE_WORDS;
            const endPhraseStartIndex = startPhraseEndIndex + FRAGMENT_CONTINUATION_SEPARATION;
            const endPhraseEndIndex = endPhraseStartIndex + FRAGMENT_END_PHRASE_WORDS;

            if (endPhraseEndIndex <= paragraphWordCount) {
                const textStart = paragraphWords.slice(0, startPhraseEndIndex).join(' ');
                const textEnd = paragraphWords.slice(endPhraseStartIndex, endPhraseEndIndex).join(' ');
                textFragmentHash = `#:~:text=${encodeURIComponent(textStart)},${encodeURIComponent(textEnd)}`;
                break;
            }
        }
    }

    return textFragmentHash;
}; 