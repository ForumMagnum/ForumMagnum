import { isMobile } from '@/lib/utils/isMobile';
import { HashLinkHandler } from './useModalScroll';

/**
 * Extract footnote HTML content from the DOM
 */
const extractFootnoteHTML = (targetId: string): string | null => {
  try {
    const footnoteElement = document.getElementById(targetId);
    if (!footnoteElement) return null;
    
    // Check if this is a non-empty footnote
    const hasContent = !!Array.from(footnoteElement.querySelectorAll("p, li"))
      .reduce((acc, p) => acc + (p.textContent || ''), "").trim();
    
    return hasContent ? footnoteElement.innerHTML : null;
  } catch (e) {
    return null;
  }
};

export interface FootnoteHandlerOptions {
  onFootnoteClick?: (footnoteHTML: string) => void;
}

/**
 * Hook that provides handlers for footnote links on mobile devices
 * @param options Options including callback for when footnote is clicked
 * @returns Array of HashLinkHandler for footnotes
 */
export const useFootnoteHandlers = (options?: FootnoteHandlerOptions): HashLinkHandler[] => {
  const { onFootnoteClick } = options || {};
  
  // Return handler that checks isMobile inside the event handler
  return [{
    pattern: /^fn[a-zA-Z0-9]+$/,
    handler: (targetId, targetElement, event) => {
      // Check if mobile inside the handler, not during render
      if (!isMobile()) {
        return false;
      }
      
      // Check for regular click (left button, no modifier keys)
      if (event.button !== 0 || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
        return false;
      }
      
      const footnoteHTML = extractFootnoteHTML(targetId);
      
      if (footnoteHTML && onFootnoteClick) {
        onFootnoteClick(footnoteHTML);
        return true;
      }
      return false;
    }
  }];
}; 
