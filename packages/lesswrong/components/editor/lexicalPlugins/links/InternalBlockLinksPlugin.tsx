"use client";

/**
 * Utilities for preserving data-internal-id attributes on block elements
 * during HTML import/export in Lexical.
 * 
 * These IDs are used to create internal links to specific blocks within a document.
 */

// Map to store internal IDs by element index during import/export
export type InternalIdMap = Map<number, string>;

/**
 * Extract data-internal-id attributes from HTML before Lexical processes it.
 * Returns a map of element indices to their internal IDs.
 */
export function extractInternalIds(html: string): InternalIdMap {
  const internalIds: InternalIdMap = new Map();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Get all block elements that might have data-internal-id
  const blockElements = doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, blockquote, li');
  
  blockElements.forEach((el, index) => {
    const internalId = el.getAttribute('data-internal-id');
    if (internalId) {
      internalIds.set(index, internalId);
    }
  });
  
  return internalIds;
}

/**
 * Restore data-internal-id attributes to exported HTML.
 * Takes the original internal ID map and applies them to the new HTML.
 */
export function restoreInternalIds(html: string, internalIds: InternalIdMap): string {
  if (internalIds.size === 0) {
    return html;
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Get all block elements in the same order
  const blockElements = doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, blockquote, li');
  
  internalIds.forEach((id, index) => {
    if (blockElements[index]) {
      blockElements[index].setAttribute('data-internal-id', id);
    }
  });
  
  return doc.body.innerHTML;
}

/**
 * Process HTML to preserve data-internal-id during round-trip.
 * Returns both the processed HTML (with IDs removed for Lexical) and the ID map.
 */
export function preprocessHtmlForImport(html: string): { html: string; internalIds: InternalIdMap } {
  const internalIds = extractInternalIds(html);
  
  // Remove data-internal-id from the HTML so Lexical doesn't get confused
  // (Lexical's default nodes don't know how to handle this attribute)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const elementsWithId = doc.querySelectorAll('[data-internal-id]');
  elementsWithId.forEach((el) => {
    el.removeAttribute('data-internal-id');
  });
  
  return {
    html: doc.body.innerHTML,
    internalIds,
  };
}

