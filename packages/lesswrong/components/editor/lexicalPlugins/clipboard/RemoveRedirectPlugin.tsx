"use client";

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isElementNode, LexicalNode, ElementNode } from 'lexical';
import { $isLinkNode, LinkNode } from '@lexical/link';

// Pattern to match Google redirect URLs
// Examples:
// https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page&sa=D&source=editors&ust=1667922372715536&usg=AOvVaw2NyT5CZhfsrRY_zzMs2UUJ
// https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page
const GOOGLE_REDIRECT_PATTERN = /^https:\/\/www\.google\.com\/url\?q=(\S+?)(&|$)/;

/**
 * Extract the target URL from a Google redirect URL
 */
function extractTargetUrl(redirectUrl: string): string | null {
  const match = redirectUrl.match(GOOGLE_REDIRECT_PATTERN);
  if (match) {
    // Decode the URL (it may be URL-encoded)
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/**
 * Recursively process nodes to fix redirect links
 */
function processNode(node: LexicalNode): void {
  if ($isLinkNode(node)) {
    const url = node.getURL();
    const targetUrl = extractTargetUrl(url);
    if (targetUrl) {
      node.setURL(targetUrl);
    }
  }

  if ($isElementNode(node)) {
    const children = node.getChildren();
    for (const child of children) {
      processNode(child);
    }
  }
}

/**
 * Plugin to remove Google redirect wrappers from pasted links.
 * 
 * When users copy content from Google Docs "Publish to Web" pages,
 * links are wrapped in Google redirect URLs. This plugin automatically
 * unwraps them to their original target URLs.
 * 
 * Example:
 * - Input: https://www.google.com/url?q=https://example.com&sa=D&...
 * - Output: https://example.com
 */
export function RemoveRedirectPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Listen for paste events and process links
    const removeListener = editor.registerUpdateListener(({ tags }) => {
      // Only process on paste operations, and don't process on other users' operations
      if (!tags.has('paste') || !tags.has('collaboration')) {
        return;
      }

      // Process all dirty elements to fix redirect links
      editor.update(() => {
        const root = $getRoot();
        processNode(root);
      }, { tag: 'remove-redirect' });
    });

    return removeListener;
  }, [editor]);

  return null;
}

export default RemoveRedirectPlugin;

