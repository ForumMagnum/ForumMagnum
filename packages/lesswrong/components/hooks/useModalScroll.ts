import { useEffect, RefObject } from 'react';
import { useTheme } from '../themes/useTheme';
import { isMobile } from '@/lib/utils/isMobile';

/**
 * Utility function to scroll to a target element within a container
 * @param container - The scrollable container element
 * @param targetElement - The element to scroll to
 * @param offsetRatio - What fraction from the top of the container to position the element (default: 0.2 = 20%)
 */
export const scrollToElementInContainer = (
  container: HTMLElement,
  targetElement: HTMLElement,
  offsetRatio = 0.2
) => {
  const containerRect = container.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  const offsetInsideContainer = targetRect.top - containerRect.top;
  
  container.scrollTo({
    top: container.scrollTop + offsetInsideContainer - (container.clientHeight * offsetRatio),
    behavior: 'smooth',
  });
};

/**
 * Hook to get theme-aware highlight function (we briefly highlight items upon scrolling to them)
 */
const useHighlightElement = () => {
  const theme = useTheme();
  
  return (element: HTMLElement, duration = 1000) => {
    const highlightColor = `${theme.palette.primary.main}4c`;
    
    element.style.backgroundColor = highlightColor;
    element.style.transition = 'background-color 0.3s ease-in-out';
    
    setTimeout(() => {
      element.style.backgroundColor = '';
      setTimeout(() => {
        element.style.transition = '';
      }, 300);
    }, duration);
  };
};

const extractFootnoteHTML = (targetId: string): string | null => {
  try {
    const footnoteElement = document.getElementById(targetId);
    if (!footnoteElement) return null;
    
    const hasContent = !!Array.from(footnoteElement.querySelectorAll("p, li"))
      .reduce((acc, p) => acc + (p.textContent || ''), "").trim();
    
    return hasContent ? footnoteElement.innerHTML : null;
  } catch (e) {
    return null;
  }
};

const handleFootnoteClick = (
  targetId: string,
  targetElement: HTMLElement,
  event: MouseEvent,
  onFootnoteClick?: (footnoteHTML: string) => void
): boolean => {
  // Only handle footnotes on mobile
  if (!isMobile()) {
    return false;
  }
  
  // Check if this is a footnote pattern
  if (!/^fn[a-zA-Z0-9]+$/.test(targetId)) {
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
};

/**
 * Hook that intercepts clicks on hash links within a modal
 * and scrolls to the target element instead of changing the URL hash.
 * 
 * @param scrollContainerRef - Reference to the scrollable container element
 * @param enabled - Whether the hook should be active (default: true)
 * @param shouldHighlight - Whether to highlight the target element after scrolling (default: false)
 * @param onFootnoteClick - Optional callback for when a footnote is clicked on mobile
 */
export const useModalHashLinkScroll = (
  scrollContainerRef: RefObject<HTMLElement | null>,
  enabled = true,
  shouldHighlight = false,
  onFootnoteClick?: (footnoteHTML: string) => void
) => {
  const highlightElementWithTheme = useHighlightElement();
  
  useEffect(() => {
    if (!enabled) return;

    const handleHashLinkClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);
      
      if (!targetElement) return;

      const container = scrollContainerRef.current;
      if (!container || !container.contains(targetElement)) return;

      // Prevent default behavior, changing URL hash
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Stop other handlers from running

      // Check if this is a footnote click
      const footnoteHandled = handleFootnoteClick(targetId, targetElement, e, onFootnoteClick);
      if (footnoteHandled) return;

      // Default behavior: scroll to the element
      scrollToElementInContainer(container, targetElement);

      if (shouldHighlight) {
        highlightElementWithTheme(targetElement);
      }
    };

    document.addEventListener('click', handleHashLinkClick, true);

    return () => {
      document.removeEventListener('click', handleHashLinkClick, true);
    };
  }, [scrollContainerRef, enabled, shouldHighlight, highlightElementWithTheme, onFootnoteClick]);
}; 
