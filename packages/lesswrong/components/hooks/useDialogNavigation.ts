import { useEffect, useRef } from 'react';

/**
 * Manages browser navigation for dialogs by:
 * 1. Adding a history entry when the dialog opens
 * 2. Handling browser back button/swipe to close the dialog
 * 3. Cleaning up the history entry when the dialog closes normally
 * 4. Optionally updating the URL while the dialog is open
 * 
 * This ensures that the back button closes the dialog instead of
 * navigating away from the page. Also that if the page is refreshed,
 * the user will not lose the post, and they can share by copy/pasting the url.
 * 
 * @param onClose - Function to call when the dialog should close
 * @param modalUrl - Optional URL to display while the dialog is open
 */
export const useDialogNavigation = (onClose: () => void, modalUrl?: string) => {
  const isClosingViaBackRef = useRef(false);

  useEffect(() => {
    // Push a new history entry. If modalUrl is provided, use it; otherwise keep current URL
    window.history.pushState({ dialogOpen: true }, '', modalUrl);

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
  }, [onClose, modalUrl]);
}; 
