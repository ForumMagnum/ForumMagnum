import { useEffect } from "react";

// Give images and math a moment to finish rendering after fonts are ready
// before opening the print dialog.
const PRINT_DELAY_MS = 500;

/**
 * Opens the browser's print dialog (from which the user can save the page as
 * a PDF) once `shouldPrint` becomes true. Used by the "Save as PDF" post
 * action, which opens the post page with a query parameter that turns this on.
 */
export function usePrintOnLoad(shouldPrint: boolean) {
  useEffect(() => {
    if (!shouldPrint) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      timeout = setTimeout(() => {
        if (!cancelled) window.print();
      }, PRINT_DELAY_MS);
    });
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [shouldPrint]);
}
