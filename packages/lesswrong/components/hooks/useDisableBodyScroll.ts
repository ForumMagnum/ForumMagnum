import { useEffect } from 'react';

/**
 * Disables scrolling on the document body when the component mounts,
 * and restores the original overflow setting when the component unmounts.
 * 
 * This is useful for modals, dialogs, and other overlays that should
 * prevent the background content from scrolling while they are open.
 */
export const useDisableBodyScroll = () => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
}; 
