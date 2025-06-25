import { useEffect, useRef } from 'react';

/**
 * Manages browser navigation for dialogs by:
 * 1. Adding a history entry when the dialog opens
 * 2. Handling browser back button/swipe to close the dialog
 * 3. Cleaning up the history entry when the dialog closes normally
 * 
 * This ensures that the back button closes the dialog instead of
 * navigating away from the page.
 * 
 * @param onClose - Function to call when the dialog should close
 */
export const useDialogNavigation = (onClose: () => void) => {
  const isClosingViaBackRef = useRef(false);

  useEffect(() => {
    window.history.pushState({ dialogOpen: true }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (!event.state?.dialogOpen) {
        isClosingViaBackRef.current = true;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If dialog is closing normally (not via back), remove the history entry
      if (!isClosingViaBackRef.current && window.history.state?.dialogOpen) {
        window.history.back();
      }
    };
  }, [onClose]);
}; 
