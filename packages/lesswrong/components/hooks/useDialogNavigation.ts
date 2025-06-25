import { useEffect, useRef } from 'react';

interface UseDialogNavigationOptions {
  /**
   * Whether to track if the dialog is closing via the back button.
   * When true, returns an isClosingViaBackRef that can be used to determine
   * if the dialog is closing via browser navigation.
   */
  trackClosingViaBack?: boolean;
}

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
 * @param options - Optional configuration
 * @returns Object with isClosingViaBackRef if trackClosingViaBack is true
 */
export const useDialogNavigation = (
  onClose: () => void,
  options?: UseDialogNavigationOptions
) => {
  const isClosingViaBackRef = useRef(false);
  const { trackClosingViaBack = false } = options || {};

  useEffect(() => {
    window.history.pushState({ dialogOpen: true }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (!event.state?.dialogOpen) {
        if (trackClosingViaBack) {
          isClosingViaBackRef.current = true;
        }
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If dialog is closing normally (not via back), remove the history entry
      if (
        (!trackClosingViaBack || !isClosingViaBackRef.current) && 
        window.history.state?.dialogOpen
      ) {
        window.history.back();
      }
    };
  }, [onClose, trackClosingViaBack]);

  return trackClosingViaBack ? { isClosingViaBackRef } : {};
}; 
