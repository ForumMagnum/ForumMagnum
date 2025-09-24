import { useEffect } from 'react';

/**
 * Hook that intercepts link clicks within a container and opens them in new tabs
 * @param containerRef - Optional ref to limit the scope of interception
 * @param currentPath - Optional current path to determine if a link is same-page with hash
 */
export const useOpenLinksInNewTab = (
  containerRef?: React.RefObject<HTMLElement | null>,
  currentPath?: string
) => {
  useEffect(() => {

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      
      // If containerRef is provided, check if click is within it
      if (containerRef?.current && !containerRef.current.contains(target)) {
        return;
      }
      
      // Find the closest <a> tag
      const link = target.closest('a') as HTMLAnchorElement | null;
      const href = link?.getAttribute('href');
      
      // Skip if no link, no href, or should be handled normally
      if (!link || !href || 
          link.target === '_blank' || 
          e.button !== 0 ||            
          e.ctrlKey || e.shiftKey || e.metaKey || 
          href.startsWith('#') ||      
          (currentPath && href.startsWith(currentPath + '#'))) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      window.open(href, '_blank');
    };

    // Use capture phase to intercept clicks before React Router
    // TODO: Something better. I don't love this but interim solution while figure out if sticking with modals anyway.
    document.addEventListener('click', handler, true);
    return () => {
      document.removeEventListener('click', handler, true);
    };
  }, [containerRef, currentPath]);
};
