import { textReplacementsSetting } from "@/lib/publicSettings";
import { useRef } from "react";

type ReplacementTuple = [string, string];

interface WalkNodeTreeOptions {
  inspect: (node: Node) => boolean;
  collect: (node: Node) => boolean;
  callback?: (node: Node) => void;
}

const PROCESSED_FLAG = Symbol('processed');

function markProcessed(node: Node) {
  (node as any)[PROCESSED_FLAG] = true;
}

function isProcessed(node: Node): boolean {
  return !!(node as any)[PROCESSED_FLAG];
}

function walkNodeTree(root: Node, options: WalkNodeTreeOptions) {
  const { inspect, collect, callback } = options;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ALL,
    {
      acceptNode: function(node) {
        if (!inspect(node)) return NodeFilter.FILTER_REJECT;
        if (!collect(node)) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  let n;
  // eslint-disable-next-line no-cond-assign
  while (n = walker.nextNode()) {
    // callback?.(n);
    nodes.push(n);
  }

  return nodes;
}

function textNodesUnder(el: Node) {
  return walkNodeTree(el, {
    inspect: n => !['STYLE', 'SCRIPT'].includes(n.nodeName),
    collect: n => (n.nodeType === Node.TEXT_NODE),
    //callback: n => console.log(n.nodeName, n),
  });
}

function matchCaseFormat(original: string, replacement: string) {
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }

  if (original === original.toLowerCase()) {
    return replacement.toLowerCase();
  }

  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
  }

  return replacement.toLowerCase();
}

function replaceText(node: Node, replacements: ReplacementTuple[]) {
  if (isProcessed(node)) return;

  let text = node.textContent ?? '';
  let modified = false;

  replacements.forEach(([searchText, replacementText]) => {
    const searchWords = searchText.split(/\s+/);
    const replaceWords = replacementText.split(/\s+/);

    // Create a pattern that matches both spaced and unspaced versions
    const regexPattern = searchWords.map(word => `(${word})`).join('\\s*');
    const regex = new RegExp(`(${regexPattern})(\\s*)`, 'gi');

    text = text.replace(regex, (match, ...args) => {
      modified = true;
      const capturedWords = args.slice(0, -3);  // Exclude the last two items (offset and original string)
      const trailingWhitespace = args[args.length - 3] ?? '';  // Get trailing whitespace

      // Determine if original had spaces between words
      const hadSpaces = match.trim() !== match.replace(/\s+/g, '');

      const replacedPhrase = replaceWords.map((word, index) => 
        matchCaseFormat(capturedWords[index] ?? '', word)
      ).join(hadSpaces ? ' ' : '');

      return replacedPhrase + trailingWhitespace;
    });
  });

  if (modified) {
    node.textContent = text;
  }

  markProcessed(node);
}

export function useReplaceTextContent() {
  const replacements: ReplacementTuple[] = Object.entries(textReplacementsSetting.get());
  const observerRef = useRef<MutationObserver | null>();

  return () => {
    for (let node of textNodesUnder(document.body)) {
      replaceText(node, replacements);
    }

    if (!observerRef.current) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                for (let textNode of textNodesUnder(node)) {
                  replaceText(textNode, replacements);
                }
              } else if (node.nodeType === Node.TEXT_NODE) {
                replaceText(node, replacements);
              }
            });
          } else if (mutation.type === 'characterData') {
            replaceText(mutation.target, replacements);
          }
        });
      });  

      observerRef.current = observer;
    }

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true, 
      characterDataOldValue: true,
    });    
  };
}
