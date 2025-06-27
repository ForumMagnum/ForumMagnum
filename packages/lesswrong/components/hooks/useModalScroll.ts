import { useEffect, RefObject } from 'react';
import { useTheme } from '../themes/useTheme';

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
 * Utility function to highlight an element temporarily
 * @param element - The element to highlight
 * @param duration - How long to show the highlight in milliseconds (default: 1000)
 * @param color - The highlight color
 */
export const highlightElement = (element: HTMLElement, duration = 1000, color: string) => {
  element.style.backgroundColor = color;
  element.style.transition = 'background-color 0.3s ease-in-out';
  
  setTimeout(() => {
    element.style.backgroundColor = '';
    setTimeout(() => {
      element.style.transition = '';
    }, 300);
  }, duration);
};


/**
 * Hook to get theme-aware highlight function
 */
export const useHighlightElement = () => {
  const theme = useTheme();
  
  return (element: HTMLElement, duration = 1000) => {
    const highlightColor = `${theme.palette.primary.main}4c`;
    highlightElement(element, duration, highlightColor);
  };
};

/**
 * Hook that intercepts clicks on hash links (like footnotes) within a modal
 * and scrolls to the target element instead of changing the URL hash.
 * 
 * @param scrollContainerRef - Reference to the scrollable container element
 * @param enabled - Whether the hook should be active (default: true)
 * @param shouldHighlight - Whether to highlight the target element after scrolling (default: false)
 */
export const useModalHashLinkScroll = (
  scrollContainerRef: RefObject<HTMLElement | null>,
  enabled = true,
  shouldHighlight = false
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

      // Prevent default behavior (changing URL hash)
      e.preventDefault();
      e.stopPropagation();

      scrollToElementInContainer(container, targetElement);

      if (shouldHighlight) {
        highlightElementWithTheme(targetElement);
      }
    };

    document.addEventListener('click', handleHashLinkClick, true);

    return () => {
      document.removeEventListener('click', handleHashLinkClick, true);
    };
  }, [scrollContainerRef, enabled, shouldHighlight, highlightElementWithTheme]);
}; 
